/**
 * Hybrid scraping pipeline:
 *  1. Playwright (chromium) loads the page → grabs rendered HTML
 *  2. Cheerio extracts a compact "main content" string (drops scripts/styles/nav)
 *  3. LLM converts that compact HTML into structured JSON matching our schema
 *
 * This is more robust than asking the model to "go look at the site" — we control the source
 * of truth (the HTML) and only use the model for unstructured → structured conversion.
 */
// playwright is imported lazily inside fetchRenderedHTML so that Vercel / serverless
// builds that DON'T include the Chromium binary don't crash at module-load time.
import * as cheerio from 'cheerio';
import { extractWithLLM } from './llm';

let _browser: any = null;

async function browser() {
  if (_browser && _browser.isConnected()) return _browser;
  const { chromium } = await import('playwright').catch(() => {
    throw new Error(
      'Playwright is not available in this runtime. Scrapers can only run on a host with ' +
      'the Chromium binary installed (local dev, Fly.io, Railway, VPS). Vercel serverless ' +
      'functions cannot host Playwright — call this endpoint from a separate worker.',
    );
  });
  _browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

export async function fetchRenderedHTML(url: string, opts: { waitFor?: string; timeoutMs?: number } = {}) {
  const b = await browser();
  const ctx = await b.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeoutMs ?? 30_000 });
    if (opts.waitFor) await page.waitForSelector(opts.waitFor, { timeout: 8_000 }).catch(() => {});
    // Let lazy images / hydration settle
    await page.waitForTimeout(1500);
    return await page.content();
  } finally {
    await ctx.close();
  }
}

/** Strip noisy DOM and cap length so the LLM stays under context. */
export function distillHTML(html: string, maxChars = 40_000) {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg').remove();
  // Prefer <main>, fall back to <body>
  const root = $('main').length ? $('main') : $('body');
  const text = root.html() || '';
  // Collapse whitespace
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > maxChars ? compact.slice(0, maxChars) : compact;
}

export type ExtractedEvent = {
  title?: string;
  artist?: string;
  venue?: string;
  city?: string;
  date?: string;
  time?: string;
  image_url?: string;
  source_url?: string;
  genre?: string;
  status?: string;
  description?: string;
  zones?: { name?: string; price?: number; available?: number }[];
};

export type ExtractedHotel = {
  hotel_name?: string;
  address?: string;
  rating?: number;
  price_per_night?: number;
  room_type?: string;
  amenities?: string[];
  image_url?: string;
  source_url?: string;
  distance_to_venue?: string;
};

/** Use LLM to turn distilled HTML into an array of events. */
export async function extractEvents(html: string, sourceUrl: string): Promise<ExtractedEvent[]> {
  const prompt = `You are a structured-data extractor. From the HTML snippet below (already simplified — content of <main>), extract upcoming concerts/events.

Return JSON of shape:
{
  "events": [
    {
      "title": string,
      "artist": string,
      "venue": string,
      "city": string,           // default "Bangkok"
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "image_url": string,      // absolute URL of poster image
      "source_url": string,     // absolute URL of the event detail page
      "genre": "rock"|"pop"|"hip-hop"|"electronic"|"jazz"|"classical"|"k-pop"|"indie"|"metal"|"other",
      "status": "upcoming"|"on_sale",
      "zones": [{ "name": string, "price": number }]
    }
  ]
}

Rules:
- Resolve relative URLs against ${sourceUrl}
- Return at most 20 events
- Skip duplicate events
- Output JSON only — no markdown fences

HTML:
${html}`;
  const result = await extractWithLLM<{ events?: ExtractedEvent[] }>({
    prompt,
    responseJsonSchema: { type: 'object' },
    longContext: true,
  });
  if (typeof result === 'string') return [];
  return result?.events ?? [];
}

export async function extractHotels(html: string, sourceUrl: string): Promise<ExtractedHotel[]> {
  const prompt = `Extract hotels listed in this HTML snippet (already simplified to <main>).

Return JSON of shape:
{
  "hotels": [
    {
      "hotel_name": string,
      "address": string,
      "rating": number,            // out of 5 (normalize if site uses /10)
      "price_per_night": number,   // in THB
      "room_type": string,
      "amenities": [string],
      "image_url": string,         // absolute URL
      "source_url": string,        // absolute URL of the hotel detail page
      "distance_to_venue": string
    }
  ]
}

Rules:
- Resolve relative URLs against ${sourceUrl}
- Return at most 15 hotels
- Output JSON only — no markdown fences

HTML:
${html}`;
  const result = await extractWithLLM<{ hotels?: ExtractedHotel[] }>({
    prompt,
    responseJsonSchema: { type: 'object' },
    longContext: true,
  });
  if (typeof result === 'string') return [];
  return result?.hotels ?? [];
}
