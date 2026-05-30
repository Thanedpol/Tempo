import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { getAdminSupabase, getServerSupabase } from '@/server/supabaseServer';
import { fetchTicketmelonThaiEvents } from '@/server/ticketmelon';
import { memRefresh } from '@/server/memStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Sync Thai events from Ticketmelon's public JSON API.
 * No LLM, no Playwright — just fetch + map. Writes to Supabase if configured,
 * otherwise refreshes the in-memory store used by /api/entities/events.
 */
export async function POST() {
  const g = await requireAdmin();
  if ('error' in g) return g.error;

  try {
    const events = await fetchTicketmelonThaiEvents(80);

    const sb = await getServerSupabase();
    if (!sb) {
      const count = await memRefresh('events');
      return NextResponse.json({ success: true, count, message: `Loaded ${count} Thai events into memory.` });
    }

    // Live mode → upsert into the events table. Use service-role to bypass RLS on the public catalogue.
    const admin = getAdminSupabase();
    const rows = events.map(({ id: _drop, created_date: _cd, ...row }) => row);   // let DB assign UUID + timestamp
    const { data, error } = await admin.from('events').insert(rows).select('id,title,date');
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, count: data?.length ?? 0, message: `Synced ${data?.length ?? 0} events from Ticketmelon.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Sync failed' }, { status: 500 });
  }
}
