'use client';
import { createBrowserClient } from '@supabase/ssr';

const url      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the deploy is missing Supabase env vars. Login page reads this to disable buttons. */
export const supabaseConfigured = !!(url && anonKey && url.startsWith('https://'));

if (typeof window !== 'undefined' && !supabaseConfigured) {
  console.warn(
    '[supabaseBrowser] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
    'Login will not work until these are set in Vercel project settings + redeployed.\n' +
    'Workaround: set NEXT_PUBLIC_DEV_BYPASS_AUTH=true to skip login entirely.',
  );
}

export const supabase = createBrowserClient(url || 'http://placeholder', anonKey || 'placeholder');
