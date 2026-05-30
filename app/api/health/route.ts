import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public health/config check. No secrets are returned — only flags
 * indicating whether each env var is present. Use this to verify a
 * Vercel deploy was configured correctly before debugging auth flows.
 *
 *   curl https://<your-deploy>/api/health | jq .
 */
export async function GET() {
  const sb = {
    url:        !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey:    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const allSupabaseSet = sb.url && sb.anonKey && sb.serviceKey;

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: process.env.VERCEL ? 'vercel' : 'node',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    devBypassAuth: process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true',
    supabase: {
      ...sb,
      ready: allSupabaseSet,
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}…`
        : null,
    },
    llm: {
      provider: process.env.LLM_PROVIDER || 'openrouter (default)',
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      hasOpenAI:     !!process.env.OPENAI_API_KEY,
      hasAnthropic:  !!process.env.ANTHROPIC_API_KEY,
      hasGemini:     !!process.env.GEMINI_API_KEY,
    },
    affiliate: {
      agoda:   !!process.env.AGODA_AFFILIATE_ID,
      booking: !!process.env.BOOKING_AFFILIATE_ID,
      klook:   !!process.env.KLOOK_AFFILIATE_ID,
    },
    advice: buildAdvice(allSupabaseSet),
  });
}

function buildAdvice(supabaseReady: boolean) {
  const out: string[] = [];
  if (!supabaseReady && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== 'true') {
    out.push('Supabase not configured → set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY, OR set NEXT_PUBLIC_DEV_BYPASS_AUTH=true to skip login.');
  }
  if (supabaseReady && !process.env.NEXT_PUBLIC_APP_URL) {
    out.push('NEXT_PUBLIC_APP_URL is not set — magic-link callback may go to the wrong host.');
  }
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    out.push('No LLM API key set — the AI chat will fail until at least one is configured.');
  }
  if (!out.length) out.push('All required env vars are set. ✓');
  return out;
}
