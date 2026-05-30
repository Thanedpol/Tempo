import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { memRefresh } from '@/server/memStore';
import { fetchTicketmelonThaiEvents } from '@/server/ticketmelon';
import { getSettings } from '@/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Trigger a manual sync for a single source. Body: { source: 'ticketmelon' | ... }
 * Returns: { ok, source, count, latencyMs }
 */
export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if ('error' in g) return g.error;

  const body = await req.json().catch(() => ({}));
  const source = String(body?.source || '').toLowerCase();
  const started = Date.now();

  try {
    let count = 0;
    if (source === 'ticketmelon') {
      const limit = getSettings().crawler.maxPerSource;
      const rows = await fetchTicketmelonThaiEvents(limit);
      // Replace the events memstore with the fresh fetch
      count = rows.length;
      await memRefresh('events');                // calls fetcher again
    } else {
      return NextResponse.json({ ok: false, error: `Source "${source}" not implemented yet` }, { status: 400 });
    }
    return NextResponse.json({ ok: true, source, count, latencyMs: Date.now() - started });
  } catch (e: any) {
    return NextResponse.json({ ok: false, source, error: e?.message || String(e), latencyMs: Date.now() - started }, { status: 200 });
  }
}
