/**
 * Payment foundation — provider-agnostic charge lifecycle with idempotency
 * and reconciliation. Directly targets the two biggest ticket pain points:
 *   #1 "system crash / kicked out of payment"  → idempotency + pollable status
 *   #2 "charged but no ticket"                  → webhook + reconcile() authority
 *
 * Provider is chosen from env at runtime:
 *   - PromptPay / card → Omise   (set OMISE_SECRET_KEY)   ← recommended for TH
 *   - card             → Stripe  (set STRIPE_SECRET_KEY)
 *   - neither set       → 'demo' (fully working flow, NO real charge)
 *
 * Persistence: in-process Map (resets on restart, like settings.ts). This is a
 * FOUNDATION — production needs a `payments` table (see docs/GAP_ANALYSIS_AND_ROADMAP.md
 * Phase 1) so state survives restarts and is shared across serverless instances.
 */
import { randomUUID } from 'crypto';

export type PayMethod = 'promptpay' | 'card';
export type PayProvider = 'omise' | 'stripe' | 'demo';
export type PayStatus = 'pending' | 'paid' | 'failed' | 'expired';

export type Payment = {
  id: string;
  userId: string;
  amount: number;            // THB (baht), integer
  currency: 'THB';
  method: PayMethod;
  provider: PayProvider;
  providerRef: string | null;
  status: PayStatus;
  idempotencyKey: string;
  qrImage: string | null;        // PromptPay QR (data-URI in demo, download_uri from Omise)
  authorizeUri: string | null;   // 3DS / redirect URL when a provider needs one
  clientSecret: string | null;   // Stripe PaymentIntent client_secret (card)
  ticketCode: string | null;     // issued once paid
  event: { title?: string; venue?: string; date?: string; zone?: string } | null;
  createdAt: number;
  updatedAt: number;
};

const store = new Map<string, Payment>();
const byIdem = new Map<string, string>(); // idempotencyKey -> paymentId

function findByProviderRef(ref: string | null | undefined): Payment | null {
  if (!ref) return null;
  for (const p of store.values()) if (p.providerRef === ref) return p;
  return null;
}

export function pickProvider(method: PayMethod): PayProvider {
  const hasOmise = !!process.env.OMISE_SECRET_KEY;
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  if (method === 'promptpay') return hasOmise ? 'omise' : 'demo';
  if (hasOmise) return 'omise';
  if (hasStripe) return 'stripe';
  return 'demo';
}

export function getPayment(id: string): Payment | null {
  return store.get(id) || null;
}

/** Mask-safe view for the browser (never leak the raw Stripe secret etc.). */
export function toPublic(p: Payment) {
  return {
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    provider: p.provider,
    status: p.status,
    demo: p.provider === 'demo',
    qrImage: p.qrImage,
    authorizeUri: p.authorizeUri,
    clientSecret: p.clientSecret,
    ticketCode: p.status === 'paid' ? p.ticketCode : null,
    event: p.event,
  };
}

/** Create (or return the existing, for idempotency) a payment + provider charge. */
export async function createPayment(input: {
  userId: string;
  amount: number;
  method: PayMethod;
  idempotencyKey: string;
  event?: Payment['event'];
}): Promise<Payment> {
  const existingId = byIdem.get(input.idempotencyKey);
  if (existingId) {
    const existing = store.get(existingId);
    if (existing) return existing;   // ← same key never double-charges
  }

  const provider = pickProvider(input.method);
  const id = 'pay_' + randomUUID();
  const p: Payment = {
    id,
    userId: input.userId,
    amount: Math.max(0, Math.round(input.amount || 0)),
    currency: 'THB',
    method: input.method,
    provider,
    providerRef: null,
    status: 'pending',
    idempotencyKey: input.idempotencyKey,
    qrImage: null,
    authorizeUri: null,
    clientSecret: null,
    ticketCode: null,
    event: input.event || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    if (provider === 'omise') await createOmiseCharge(p);
    else if (provider === 'stripe') await createStripeIntent(p);
    else {
      // demo — no real charge; build a scannable-looking placeholder for PromptPay
      p.providerRef = 'demo_' + id.slice(4, 14);
      if (p.method === 'promptpay') p.qrImage = demoQrDataUri(p);
    }
  } catch (e: any) {
    p.status = 'failed';
    p.providerRef = 'error:' + (e?.message || String(e));
  }

  store.set(id, p);
  byIdem.set(input.idempotencyKey, id);
  return p;
}

/** DEMO ONLY — simulate the provider confirming the charge (used by the UI demo). */
export function confirmDemo(id: string, userId: string): Payment | null {
  const p = store.get(id);
  if (!p || p.userId !== userId) return null;
  if (p.provider !== 'demo') return p;   // real providers confirm via webhook/reconcile
  return markPaid(id);
}

/** Idempotent transition to paid + issue a ticket code. */
export function markPaid(id: string, providerRef?: string): Payment | null {
  const p = store.get(id);
  if (!p) return null;
  if (p.status !== 'paid') {
    p.status = 'paid';
    if (providerRef) p.providerRef = providerRef;
    p.ticketCode = p.ticketCode || ('TKT-' + randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase());
    p.updatedAt = Date.now();
  }
  return p;
}

/**
 * Reconciliation — the cure for "charged but no ticket". Ask the provider for the
 * real charge state and update our record. Safe to call on every status poll.
 */
export async function reconcile(id: string): Promise<Payment | null> {
  const p = store.get(id);
  if (!p) return null;
  if (p.status === 'paid' || p.provider === 'demo') return p;
  try {
    if (p.provider === 'omise' && p.providerRef && !p.providerRef.startsWith('error:')) {
      const auth = 'Basic ' + Buffer.from((process.env.OMISE_SECRET_KEY || '') + ':').toString('base64');
      const r = await fetch('https://api.omise.co/charges/' + p.providerRef, { headers: { Authorization: auth } });
      const data = await r.json();
      if (r.ok && data?.paid) markPaid(id, data.id);
      else if (r.ok && data?.failure_code) { p.status = 'failed'; p.updatedAt = Date.now(); }
    } else if (p.provider === 'stripe' && p.providerRef && !p.providerRef.startsWith('error:')) {
      const r = await fetch('https://api.stripe.com/v1/payment_intents/' + p.providerRef, {
        headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '') },
      });
      const data = await r.json();
      if (r.ok && data?.status === 'succeeded') markPaid(id, data.id);
    }
  } catch { /* keep pending — the next poll/webhook will catch up */ }
  return store.get(id) || null;
}

/** Provider webhook → mark paid. Idempotent; safe to receive duplicates. */
export async function handleWebhook(provider: PayProvider, payload: any): Promise<{ ok: boolean }> {
  if (provider === 'omise' && payload?.data?.paid) {
    const p = findByProviderRef(payload.data.id);
    if (p) markPaid(p.id, payload.data.id);
  } else if (provider === 'stripe' && payload?.type === 'payment_intent.succeeded') {
    const pi = payload?.data?.object;
    const p = findByProviderRef(pi?.id);
    if (p) markPaid(p.id, pi?.id);
  }
  return { ok: true };
}

// ─── Provider calls (guarded by keys; structurally correct, untested w/o keys) ──

async function createOmiseCharge(p: Payment): Promise<void> {
  const auth = 'Basic ' + Buffer.from((process.env.OMISE_SECRET_KEY || '') + ':').toString('base64');
  const body = new URLSearchParams();
  body.set('amount', String(p.amount * 100));   // Omise uses satang
  body.set('currency', 'thb');
  if (p.method === 'promptpay') {
    body.set('source[type]', 'promptpay');
  } else {
    // Card requires an Omise.js token created on the client (PCI scope).
    // Not wired in this foundation — fall back so we never pretend to charge.
    throw new Error('card via Omise needs a client token (coming soon)');
  }
  const r = await fetch('https://api.omise.co/charges', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || `omise ${r.status}`);
  p.providerRef = data.id;
  p.qrImage = data?.source?.scannable_code?.image?.download_uri || null;
  p.authorizeUri = data?.authorize_uri || null;
  if (data?.paid) markPaid(p.id, data.id);
}

async function createStripeIntent(p: Payment): Promise<void> {
  const body = new URLSearchParams();
  body.set('amount', String(p.amount * 100));
  body.set('currency', 'thb');
  body.append('payment_method_types[]', 'card');
  const r = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || ''), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `stripe ${r.status}`);
  p.providerRef = data.id;
  p.clientSecret = data.client_secret || null;   // client confirms with Stripe.js
}

/** A QR-looking SVG placeholder (data-URI) so the demo PromptPay screen feels real. */
function demoQrDataUri(p: Payment): string {
  const seed = (p.id + p.amount).split('').reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 7);
  const n = 21;
  let rng = seed;
  const next = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff);
  let cells = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // keep 3 finder-pattern corners solid so it reads as a QR
      const corner = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      const on = corner ? ((x + y) % 2 === 0 || x === 0 || y === 0) : next() % 100 < 48;
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><g fill="#000">${cells}</g></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}
