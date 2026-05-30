import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/server/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth + magic link callback.
 * Supabase returns ?code=...&next=...
 * We exchange the code → cookies, then redirect back to `next`.
 */
export async function GET(req: NextRequest) {
  const url   = new URL(req.url);
  const code  = url.searchParams.get('code');
  const next  = url.searchParams.get('next') || '/';

  if (!code) return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));

  const sb = await getServerSupabase();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
