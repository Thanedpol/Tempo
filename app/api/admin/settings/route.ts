import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { getPublicSettings, updateSettings, resetSettings } from '@/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await requireAdmin();
  if ('error' in g) return g.error;
  return NextResponse.json(getPublicSettings());
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if ('error' in g) return g.error;
  const body = await req.json().catch(() => ({}));
  if (body?.action === 'reset') {
    resetSettings();
    return NextResponse.json(getPublicSettings());
  }
  updateSettings(body || {});
  return NextResponse.json(getPublicSettings());
}
