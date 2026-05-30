import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { scrapeHotelSource } from '@/server/scrapers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const g = await requireAdmin();
  if ('error' in g) return g.error;

  try {
    const r = await scrapeHotelSource({
      url: 'https://www.agoda.com/city/bangkok-th.html',
      source: 'Agoda',
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
