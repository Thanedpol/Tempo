/**
 * Ticketmelon adapter — uses their public JSON API.
 * No Playwright, no LLM, no HTML parsing. Just fetch + map.
 *
 *   GET https://api-frontend.ticketmelon.com/v1/buyer/home-page/events  → { message: TicketmelonEvent[] }
 *
 * We filter by `timezone.country === 'Asia/Bangkok'`, take the upcoming ones,
 * and convert them to our internal Event shape (matches supabase.events columns).
 */

type TmEvent = {
  event_id: string;
  name?: string;                    // ← real human-readable title
  slug: string;
  eo_slug?: string;                 // ← org slug (used in URL)
  prefix?: string;
  show_starttime?: number;          // epoch ms
  show_endtime?: number;
  img_poster?: string;
  img_banner?: string;
  description?: string;
  venue?: { name?: string; address?: string; detail?: string; latitude?: number; longitude?: number };
  timezone?: { country?: string; offset?: number };
  categories?: string[];
  tag?: string[];
  is_active?: boolean;
  status?: string;
};

export type AppEvent = {
  id: string;
  title: string;
  artist: string;
  venue: string;
  city: string;
  date: string;                     // YYYY-MM-DD
  time: string;                     // HH:MM
  image_url: string;
  source_platform: 'Ticketmelon' | 'TTM' | 'Eventpop' | 'Other';
  source_url: string;
  status: 'upcoming' | 'on_sale' | 'sold_out' | 'cancelled';
  genre: string;
  description: string;
  tags: string[];
  zones: { name: string; price: number; available: number }[];
  created_date: string;
};

const TM_GENRE_MAP: Record<string, string> = {
  music: 'pop',
  nightlife: 'electronic',
  electronic: 'electronic',
  rock: 'rock',
  metal: 'metal',
  jazz: 'jazz',
  classical: 'classical',
  'hip-hop': 'hip-hop',
  hiphop: 'hip-hop',
  rap: 'hip-hop',
  pop: 'pop',
  'k-pop': 'k-pop',
  kpop: 'k-pop',
  indie: 'indie',
};

function mapGenre(categories: string[] = [], tags: string[] = []): string {
  const all = [...categories, ...tags].map(s => s.toLowerCase());
  for (const a of all) for (const [k, v] of Object.entries(TM_GENRE_MAP)) {
    if (a.includes(k)) return v;
  }
  return 'other';
}

function stripHtml(html?: string, maxLen = 300): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function eventUrl(e: TmEvent): string {
  if (e.eo_slug && e.slug) return `https://www.ticketmelon.com/${e.eo_slug}/${e.slug}`;
  return `https://www.ticketmelon.com/${e.slug || e.event_id}`;
}

function toIsoDate(ms?: number, offsetMins = 420): string {
  if (!ms) return new Date().toISOString().slice(0, 10);
  // Apply timezone offset (Bangkok = +07:00 = 420 mins)
  const local = new Date(ms + offsetMins * 60_000);
  return local.toISOString().slice(0, 10);
}
function toTime(ms?: number, offsetMins = 420): string {
  if (!ms) return '';
  const local = new Date(ms + offsetMins * 60_000);
  return local.toISOString().slice(11, 16);
}

/** Map a single Ticketmelon record into our schema. */
export function mapTicketmelonEvent(e: TmEvent): AppEvent {
  const title = e.name?.trim() || prettify(e.slug || 'Event');
  // Use the first tag as artist when present; otherwise fall back to a guess from the title.
  const artist = e.tag?.[0] || extractArtistFromTitle(title) || 'Various Artists';
  return {
    id:              e.event_id,
    title,
    artist,
    venue:           e.venue?.name || 'TBA',
    city:            extractCity(e.venue?.detail || e.venue?.address) || 'Bangkok',
    date:            toIsoDate(e.show_starttime, e.timezone?.offset ?? 420),
    time:            toTime(e.show_starttime, e.timezone?.offset ?? 420),
    image_url:       e.img_poster || e.img_banner || '',
    source_platform: 'Ticketmelon',
    source_url:      eventUrl(e),
    status:          e.is_active ? 'on_sale' : 'upcoming',
    genre:           mapGenre(e.categories, e.tag),
    description:     stripHtml(e.description),
    tags:            [...(e.categories || []), ...(e.tag || [])].slice(0, 10),
    zones:           [{ name: 'General', price: 0, available: 100 }],  // API doesn't expose ticket types on the list endpoint
    created_date:    new Date().toISOString(),
  };
}

function prettify(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

function extractArtistFromTitle(title: string): string | null {
  // Common patterns: "Artist Live in Bangkok", "Artist – Tour Name", "Artist: Title"
  const m1 = title.match(/^(.+?)\s+Live\s+in/i);
  if (m1) return m1[1].trim();
  const m2 = title.match(/^([^–:|]+?)\s*[–:|]/);
  if (m2 && m2[1].length > 2 && m2[1].length < 60) return m2[1].trim();
  return null;
}

function extractCity(text?: string): string | null {
  if (!text) return null;
  if (/bangkok/i.test(text)) return 'Bangkok';
  if (/chiang\s*mai/i.test(text)) return 'Chiang Mai';
  if (/phuket/i.test(text)) return 'Phuket';
  if (/pattaya/i.test(text)) return 'Pattaya';
  if (/khon\s*kaen/i.test(text)) return 'Khon Kaen';
  return null;
}

type TicketType = {
  name: string;
  price: number;
  remain?: number;
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36';
const TM_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json',
  app_id: 'ticketmelon',                 // required by api-frontend.ticketmelon.com
  Referer: 'https://www.ticketmelon.com/',
};

/** Fetch ticket types for one event. Returns `null` on failure so caller can fall back. */
async function fetchTicketTypes(eventId: string): Promise<TicketType[] | null> {
  try {
    const r = await fetch(
      `https://api-frontend.ticketmelon.com/v1/buyer/event-page/${eventId}/ticket-types/default`,
      { headers: TM_HEADERS, cache: 'no-store' },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { message?: TicketType[] };
    return j.message ?? null;
  } catch {
    return null;
  }
}

/** Run async tasks with bounded concurrency. */
async function pmap<T, U>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<U>): Promise<U[]> {
  const out: U[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Fetch all events from Ticketmelon (with prices), return Thai ones sorted by date asc. */
export async function fetchTicketmelonThaiEvents(limit = 60): Promise<AppEvent[]> {
  const r = await fetch('https://api-frontend.ticketmelon.com/v1/buyer/home-page/events', {
    headers: TM_HEADERS,
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Ticketmelon API ${r.status}`);
  const data = (await r.json()) as { message?: TmEvent[] };
  const all = data.message ?? [];

  // Filter + map first
  const thai = all
    .filter(e => (e.timezone?.country || '').includes('Bangkok'))
    .filter(e => e.status === 'publish' && e.is_active !== false)
    .map(mapTicketmelonEvent)
    .filter(e => e.date >= new Date().toISOString().slice(0, 10))     // upcoming only
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);

  // Then enrich with real prices (parallel, max 8 at a time so we don't hammer the API)
  const enriched = await pmap(thai, 8, async (ev) => {
    const types = await fetchTicketTypes(ev.id);
    if (types && types.length) {
      ev.zones = types.map(t => ({
        name:      t.name || 'General',
        price:     Math.round(t.price || 0),
        available: typeof t.remain === 'number' ? t.remain : 100,
      }));
      // If everything is sold out, mark accordingly
      const totalRemain = ev.zones.reduce((s, z) => s + (z.available || 0), 0);
      if (totalRemain === 0) ev.status = 'sold_out';
    }
    return ev;
  });

  return enriched;
}
