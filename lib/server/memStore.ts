/**
 * Tiny in-process key/value store. Used as a fallback when Supabase isn't configured
 * so the SPA can still browse real data (e.g. Thai events from Ticketmelon).
 *
 * Data lives for the lifetime of the Node process — fine for dev / single-instance.
 */

import { fetchTicketmelonThaiEvents, type AppEvent } from './ticketmelon';

type Entity = 'events' | 'bookings' | 'hotel_bookings' | 'ai_sessions' | 'notifications';
const store: Map<Entity, any[]> = new Map();
const seedAt: Map<Entity, number> = new Map();
const inflight: Map<Entity, Promise<void>> = new Map();

const TTL_MS = 10 * 60 * 1000;   // refresh after 10 minutes

async function seedEvents() {
  try {
    const rows = await fetchTicketmelonThaiEvents(80);
    store.set('events', rows);
    seedAt.set('events', Date.now());
  } catch (e) {
    console.warn('[memStore] Ticketmelon seed failed:', (e as Error).message);
    if (!store.has('events')) store.set('events', []);
    seedAt.set('events', Date.now());
  }
}

/** Sample notifications so the bell icon shows a real badge in dev mode. */
function seedNotifications() {
  const now = Date.now();
  store.set('notifications', [
    {
      id: 'notif-1',
      title: 'พบอีเวนต์ใหม่ที่ตรงกับความสนใจ',
      message: 'J.I.D – God Does Like World Tours BANGKOK · เปิดขายแล้ว',
      type: 'event_found',
      priority: 'high',
      is_read: false,
      created_date: new Date(now - 5 * 60_000).toISOString(),
    },
    {
      id: 'notif-2',
      title: 'AI พร้อมจองตั๋วให้คุณ',
      message: 'ระบบ AI จะช่วยจองตั๋วอัตโนมัติเมื่อตั๋วเริ่มขาย',
      type: 'reminder',
      priority: 'medium',
      is_read: false,
      created_date: new Date(now - 30 * 60_000).toISOString(),
    },
    {
      id: 'notif-3',
      title: 'ยินดีต้อนรับสู่ Tempo AI Hub',
      message: 'เริ่มต้นด้วยการบอก AI ว่าคุณอยากดูคอนเสิร์ตวงไหน',
      type: 'reminder',
      priority: 'low',
      is_read: true,
      created_date: new Date(now - 24 * 60 * 60_000).toISOString(),
    },
  ]);
  seedAt.set('notifications', Date.now());
}

/** Read rows. Auto-seeds `events` from Ticketmelon on first call (and after TTL). */
export async function memList(entity: Entity, limit = 100): Promise<any[]> {
  if (entity === 'events') {
    const stale = !seedAt.has(entity) || Date.now() - (seedAt.get(entity) || 0) > TTL_MS;
    if (stale) {
      // De-dupe concurrent first-loads
      if (!inflight.has(entity)) inflight.set(entity, seedEvents().finally(() => inflight.delete(entity)));
      try { await inflight.get(entity); } catch {}
    }
  }
  if (entity === 'notifications' && !seedAt.has('notifications')) {
    seedNotifications();
  }
  return (store.get(entity) || []).slice(0, limit);
}

/** Force a refresh (used by the manual sync button). */
export async function memRefresh(entity: Entity): Promise<number> {
  if (entity === 'events') {
    await seedEvents();
    return (store.get('events') || []).length;
  }
  return (store.get(entity) || []).length;
}

export function memUpsert(entity: Entity, row: any) {
  const list = store.get(entity) || [];
  const idx = list.findIndex((r: any) => r.id === row.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.unshift({ id: crypto.randomUUID(), created_date: new Date().toISOString(), ...row });
  store.set(entity, list);
  return list[idx >= 0 ? idx : 0];
}

export function memDelete(entity: Entity, id: string) {
  const list = (store.get(entity) || []).filter((r: any) => r.id !== id);
  store.set(entity, list);
}

export function memGet(entity: Entity, id: string) {
  return (store.get(entity) || []).find((r: any) => r.id === id) || null;
}

export type { AppEvent };
