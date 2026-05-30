import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function hasSupabaseEnv() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * User-scoped Supabase client for Route Handlers / Server Components.
 * Reads + writes cookies so the user session flows through API routes.
 * RLS applies — i.e. queries respect the user's identity.
 *
 * Returns null when env vars are missing (caller should treat as "unauthenticated").
 */
export async function getServerSupabase() {
  if (!hasSupabaseEnv()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component cannot mutate cookies — safe to ignore */
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS. Use ONLY in server-side code where
 * you've already done auth/admin checks. Never expose to the browser.
 */
let _admin: ReturnType<typeof createAdminClient> | null = null;
export function getAdminSupabase() {
  if (_admin) return _admin;
  _admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _admin;
}

/**
 * "Demo mode" is on when the deploy doesn't have Supabase configured. In that
 * case we auto-sign-in as Demo User so the app is usable for browsing/screenshots
 * without forcing the operator to set up Supabase first.
 *
 * Explicit override: `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` keeps the login flow
 * even when Supabase isn't configured (you'll get a clear warning page).
 */
export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'false') return false;
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true')  return true;
  // auto: demo when Supabase env is missing
  return !hasSupabaseEnv();
}

/** Older alias kept so existing imports keep working. */
export const isDevBypass = isDemoMode;

/** Fake user returned in demo mode — id is a stable UUIDv4. */
export const DEV_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@tempo-ai-hub.local',
  user_metadata: { full_name: 'Demo User' },
} as const;

/** Optional comma-separated list of admin emails. In demo mode, the Demo User is
 *  treated as admin so the operator can explore admin pages. In real-auth mode
 *  any user whose email is in this list gets the admin role automatically. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/** Resolve the current user (or null) from cookies. */
export async function getCurrentUser() {
  if (isDemoMode()) return DEV_USER as any;
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/** Resolve the current user's role from app_users (default 'user'). */
export async function getCurrentUserRole(userId: string, email?: string | null): Promise<'user' | 'admin'> {
  // Demo mode → demo user is admin so they can explore the admin pages
  if (isDemoMode()) return 'admin';
  // Promote any email listed in ADMIN_EMAILS automatically
  if (email && adminEmails().includes(email.toLowerCase())) return 'admin';
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 'user';
  const admin = getAdminSupabase();
  const { data } = await admin.from('app_users').select('role').eq('id', userId).maybeSingle();
  return (data?.role as 'user' | 'admin') ?? 'user';
}
