import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/guards';
import { getPayment, reconcile, toPublic } from '@/server/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Poll a payment's status. Reconciles with the provider while still pending. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser();
  if ('error' in g) return g.error;

  const { id } = await params;
  let p = getPayment(id);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (p.userId !== g.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  if (p.status === 'pending') p = (await reconcile(id)) || p;
  return NextResponse.json(toPublic(p));
}
