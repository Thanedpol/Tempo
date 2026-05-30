/**
 * High-level scraper orchestrators — call from API routes.
 * Each one: fetches the listing page, extracts records, writes to Supabase, returns a summary.
 */
import { getAdminSupabase } from './supabaseServer';
import {
  distillHTML,
  extractEvents,
  extractHotels,
  fetchRenderedHTML,
  type ExtractedEvent,
  type ExtractedHotel,
} from './scrape';

const DEFAULT_EVENT_IMG = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800';
const DEFAULT_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

function todayISO() { return new Date().toISOString().split('T')[0]; }
function tomorrowISO() { return new Date(Date.now() + 86_400_000).toISOString().split('T')[0]; }

function mapEvent(e: ExtractedEvent, sourcePlatform: string, fallbackUrl: string, tags: string[]) {
  return {
    title:           e.title || 'Unnamed Event',
    artist:          e.artist || e.title || 'Unknown Artist',
    venue:           e.venue || 'TBA',
    city:            e.city || 'Bangkok',
    date:            normalizeDate(e.date),
    time:            e.time || '',
    image_url:       e.image_url || DEFAULT_EVENT_IMG,
    source_platform: sourcePlatform,
    source_url:      e.source_url || fallbackUrl,
    status:          (e.status === 'on_sale' ? 'on_sale' : 'upcoming'),
    genre:           normalizeGenre(e.genre),
    description:     e.description || '',
    tags:            tags.concat(e.genre ? [normalizeGenre(e.genre)] : []),
    zones:           Array.isArray(e.zones) && e.zones.length
      ? e.zones.map(z => ({ name: z.name || 'General', price: Number(z.price) || 0, available: z.available ?? 100 }))
      : [{ name: 'General', price: 1500, available: 100 }],
  };
}

function mapHotel(h: ExtractedHotel, source: 'Agoda' | 'Booking.com', fallbackUrl: string) {
  return {
    hotel_name:        h.hotel_name || 'Unknown Hotel',
    hotel_image:       h.image_url || DEFAULT_HOTEL_IMG,
    check_in:          todayISO(),
    check_out:         tomorrowISO(),
    room_type:         h.room_type || 'Standard Room',
    price_per_night:   Number(h.price_per_night) || 1500,
    total_price:       Number(h.price_per_night) || 1500,
    distance_to_venue: h.distance_to_venue || 'Bangkok',
    status:            'confirmed',
    source,
    source_url:        h.source_url || fallbackUrl,
    address:           h.address || 'Bangkok, Thailand',
    rating:            Math.min(5, Math.max(1, Number(h.rating) || 4)),
    amenities:         Array.isArray(h.amenities) ? h.amenities : [],
    user_id:           null,    // catalogue row, not user-owned
  };
}

function normalizeDate(d?: string) {
  if (!d) return todayISO();
  // Accept "YYYY-MM-DD" or "DD/MM/YYYY" etc.
  const iso = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ddmmyyyy = d.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const parsed = new Date(d);
  return isNaN(+parsed) ? todayISO() : parsed.toISOString().split('T')[0];
}

const ALLOWED_GENRES = ['rock','pop','hip-hop','electronic','jazz','classical','k-pop','indie','metal','other'] as const;
function normalizeGenre(g?: string) {
  if (!g) return 'other';
  const lower = g.toLowerCase().trim();
  return (ALLOWED_GENRES as readonly string[]).includes(lower) ? lower : 'other';
}

// ------------------------------------------------------------------- events
export async function scrapeEventSource(opts: {
  url: string;
  sourcePlatform: string;
  tags: string[];
  waitFor?: string;
}) {
  const html = await fetchRenderedHTML(opts.url, { waitFor: opts.waitFor });
  const distilled = distillHTML(html);
  const extracted = await extractEvents(distilled, opts.url);
  if (!extracted.length) return { success: false, count: 0, message: 'No events extracted' };

  const rows = extracted.map(e => mapEvent(e, opts.sourcePlatform, opts.url, opts.tags));
  const sb = getAdminSupabase();
  const { data, error } = await sb.from('events').insert(rows).select('id,title,date');
  if (error) return { success: false, count: 0, message: error.message };
  return { success: true, count: data?.length ?? 0, events: data, message: `Sync ${opts.sourcePlatform} OK (${data?.length ?? 0})` };
}

// ------------------------------------------------------------------- hotels
export async function scrapeHotelSource(opts: {
  url: string;
  source: 'Agoda' | 'Booking.com';
  waitFor?: string;
}) {
  const html = await fetchRenderedHTML(opts.url, { waitFor: opts.waitFor });
  const distilled = distillHTML(html);
  const extracted = await extractHotels(distilled, opts.url);
  if (!extracted.length) return { success: false, count: 0, message: 'No hotels extracted' };

  const rows = extracted.map(h => mapHotel(h, opts.source, opts.url));
  const sb = getAdminSupabase();
  const { data, error } = await sb.from('hotel_bookings').insert(rows).select('id,hotel_name');
  if (error) return { success: false, count: 0, message: error.message };
  return { success: true, count: data?.length ?? 0, hotels: data, message: `Sync ${opts.source} OK (${data?.length ?? 0})` };
}
