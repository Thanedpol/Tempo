import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/guards';
import { confirmDemo, toPublic } from '@/server/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEMO ONLY — simulate the provider confirming the charge, so the UI demo flow
 * completes through the REAL state machine. Real providers (Omise/Stripe) confirm
 * via /api/payments/webhook + reconcile(); this endpoint is a no-op for them.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser();
  if ('error' in g) return g.error;

  const { id } = await params;
  const p = confirmDemo(id, g.user.id);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(toPublic(p));
}
