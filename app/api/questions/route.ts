import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public survey + registration endpoint for the /questions landing page.
 *
 * The browser POSTs here (same-origin → no CORS), we validate, then forward the
 * row to a Google Apps Script Web App (GOOGLE_SHEETS_WEBHOOK_URL) which appends
 * it to a Google Sheet. Keeping the webhook server-side hides the URL and lets
 * us return a real success/error instead of an opaque `no-cors` response.
 *
 * If the webhook isn't configured yet we still return 200 with
 * `{ ok:false, reason:'not_configured' }` so the form is testable in dev and
 * shows a clear "set the env var" hint (mirrors the /waitlist behaviour).
 */
const Payload = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(120),
  email: z.string().trim().email('อีเมลไม่ถูกต้อง').max(200),
  contact: z.string().trim().max(120).optional().default(''),
  segment: z.string().trim().max(80).optional().default(''),
  artists: z.string().trim().max(500).optional().default(''),
  genres: z.array(z.string().max(40)).max(30).optional().default([]),
  painPoints: z.array(z.string().max(120)).max(20).optional().default([]),
  stayInterest: z.string().trim().max(40).optional().default(''),
  budget: z.string().trim().max(60).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().max(2000).optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับเพื่อให้เราติดต่อกลับ' }) }),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ ok: false, error: 'validation', fieldErrors }, { status: 422 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    // Form works, but nothing is persisted until the env var is set.
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  // Server-side timestamp (don't trust the client clock).
  const submittedAt = new Date().toISOString();
  const row = {
    ...parsed.data,
    genres: parsed.data.genres.join(', '),
    painPoints: parsed.data.painPoints.join(', '),
    submittedAt,
    source: 'questions-page',
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      // Apps Script redirects to googleusercontent.com; fetch follows it.
      redirect: 'follow',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[questions] webhook upstream error', res.status, text.slice(0, 200));
      return NextResponse.json({ ok: false, error: 'upstream', status: res.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[questions] webhook fetch failed', err);
    return NextResponse.json({ ok: false, error: 'network' }, { status: 502 });
  }
}
