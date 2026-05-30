import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { memRefresh } from '@/server/memStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Clear in-memory caches. Right now: re-seeds events; could expand to other entities. */
export async function DELETE() {
  const g = await requireAdmin();
  if ('error' in g) return g.error;
  const count = await memRefresh('events');
  return NextResponse.json({ ok: true, message: `Cache cleared. Re-seeded ${count} events.` });
}
