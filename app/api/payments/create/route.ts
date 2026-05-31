import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/guards';
import { createPayment, toPublic } from '@/server/payments';
import type { PayMethod } from '@/server/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Start a payment. Idempotent on `idempotencyKey` — retrying the same key
 * (e.g. after a crash / double-tap) returns the SAME payment, never a 2nd charge.
 */
export async function POST(req: NextRequest) {
  const g = await requireUser();
  if ('error' in g) return g.error;

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount) || 0;
  const ALLOWED: PayMethod[] = ['promptpay', 'card', 'mobilebanking', 'truemoney'];
  const method: PayMethod = ALLOWED.includes(body.method) ? body.method : 'promptpay';
  const bank = typeof body.bank === 'string' ? body.bank : null;
  const idempotencyKey = String(body.idempotencyKey || '') || randomKey();

  if (amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 });

  const p = await createPayment({
    userId: g.user.id,
    amount,
    method,
    bank,
    idempotencyKey,
    event: body.event || null,
  });

  return NextResponse.json(toPublic(p));
}

function randomKey() {
  return 'idem_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
