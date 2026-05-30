/**
 * Whitelist of allowed entity tables + per-entity behavior.
 *  - `userScoped: true`  → the table has a user_id column; we auto-fill it on insert.
 *  - `publicRead: true`  → unauthenticated visitors may read (RLS already enforces this; the API mirrors it).
 *  - `adminWrite: true`  → only admins may insert/update/delete via the API.
 */
export type EntityName = 'events' | 'bookings' | 'hotel_bookings' | 'ai_sessions' | 'notifications';

export const ENTITIES: Record<EntityName, {
  userScoped: boolean;
  publicRead: boolean;
  adminWrite: boolean;
  allowedColumns: string[];
}> = {
  events: {
    userScoped: false,
    publicRead: true,
    adminWrite: true,
    allowedColumns: [
      'title','artist','genre','venue','city','date','time',
      'image_url','source_platform','source_url','status','zones','description','tags',
    ],
  },
  bookings: {
    userScoped: true,
    publicRead: false,
    adminWrite: false,
    allowedColumns: [
      'event_id','event_title','event_date','venue','zone','quantity','total_price',
      'status','ticket_code','qr_data','payment_method','hotel_booking_id','ai_session_id',
      'notes','calendar_synced','wallet_added',
    ],
  },
  hotel_bookings: {
    // hotel_bookings is dual-purpose: scrapers seed catalogue rows (user_id=null),
    // users create their own bookings (user_id=current). We don't force user_id here;
    // RLS handles the visibility, and callers pass it explicitly when needed.
    userScoped: false,
    publicRead: true,
    adminWrite: false,
    allowedColumns: [
      'user_id','booking_id','hotel_name','hotel_image','check_in','check_out','room_type',
      'price_per_night','total_price','distance_to_venue','status','source','source_url',
      'address','rating','amenities','event_id',
    ],
  },
  ai_sessions: {
    userScoped: true,
    publicRead: false,
    adminWrite: false,
    allowedColumns: ['session_id','messages','status','current_task','found_events','preferences'],
  },
  notifications: {
    userScoped: true,
    publicRead: false,
    adminWrite: false,
    allowedColumns: ['title','message','type','is_read','action_url','event_id','booking_id','priority'],
  },
};

export function isEntity(x: string): x is EntityName {
  return Object.prototype.hasOwnProperty.call(ENTITIES, x);
}

/** "-created_date" → { column: 'created_date', ascending: false } */
export function parseOrder(input?: string | null): { column: string; ascending: boolean } {
  const raw = (input || '-created_date').trim();
  const ascending = !raw.startsWith('-');
  const column = raw.replace(/^[-+]/, '');
  return { column, ascending };
}

/** Pick only known columns; drop unknown keys to avoid 400s on stale frontend fields. */
export function pickAllowed<T extends Record<string, any>>(body: T, allowed: string[]): Partial<T> {
  const out: Partial<T> = {};
  for (const k of allowed) if (k in body) (out as any)[k] = body[k];
  return out;
}
