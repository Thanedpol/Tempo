import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/server/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Provider webhook receiver. Marks the matching payment paid (idempotent).
 *   - Omise:  configure webhook → POST /api/payments/webhook?provider=omise
 *   - Stripe: configure webhook → POST /api/payments/webhook?provider=stripe
 *
 * TODO before production: verify the signature
 *   - Stripe: `Stripe-Signature` header + STRIPE_WEBHOOK_SECRET
 *   - Omise:  validate the event by re-fetching the charge via the API
 */
export async function POST(req: NextRequest) {
  const provider = new URL(req.url).searchParams.get('provider') === 'stripe' ? 'stripe' : 'omise';
  const payload = await req.json().catch(() => ({}));
  const res = await handleWebhook(provider, payload);
  return NextResponse.json(res);
}
