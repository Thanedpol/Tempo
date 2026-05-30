import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { scrapeEventSource } from '@/server/scrapers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const g = await requireAdmin();
  if ('error' in g) return g.error;

  try {
    const r = await scrapeEventSource({
      url: 'https://www.theconcert.com/concert',
      sourcePlatform: 'Other',
      tags: ['theconcert'],
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
