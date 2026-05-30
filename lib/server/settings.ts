/**
 * Runtime settings — admin-tunable config stored in process memory.
 * Falls back to env vars when nothing is overridden. Resets on restart.
 *
 * Why in-memory: keeps prod secrets in .env (where they belong), but lets
 * the admin tweak runtime defaults (model, temperature, source toggles, …)
 * without touching the codebase or redeploying.
 */

export type LlmProvider = 'openrouter' | 'openai' | 'gemini' | 'ollama' | 'anthropic';

export type CrawlerSource =
  | 'ticketmelon'
  | 'thaiticketmajor'
  | 'eventpop'
  | 'agoda'
  | 'bookingcom';

export type Settings = {
  ai: {
    provider: LlmProvider;
    model: string;
    temperature: number;        // 0–2
    maxTokens: number;          // 256–8192
    systemPrompt: string;
    ollamaUrl: string;          // only relevant when provider=ollama
  };
  crawler: {
    enabledSources: Partial<Record<CrawlerSource, boolean>>;
    autoSyncMinutes: number;    // 0 = off; otherwise refresh every N minutes
    cacheTtlMinutes: number;
    cityFilter: string[];       // ['Bangkok', 'Chiang Mai', …]; empty = all
    maxPerSource: number;
  };
  affiliate: {
    agodaCid: string;
    bookingAid: string;
    klookAid: string;
  };
};

const DEFAULTS: Settings = {
  ai: {
    provider:     (process.env.LLM_PROVIDER as LlmProvider) || 'openrouter',
    model:        process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free',
    temperature:  0.7,
    maxTokens:    2000,
    systemPrompt: '',
    ollamaUrl:    'http://localhost:11434',
  },
  crawler: {
    enabledSources: {
      ticketmelon:     true,
      thaiticketmajor: false,
      eventpop:        false,
      agoda:           false,
      bookingcom:      false,
    },
    autoSyncMinutes:  10,
    cacheTtlMinutes:  10,
    cityFilter:       ['Bangkok'],
    maxPerSource:     80,
  },
  affiliate: {
    agodaCid:   process.env.AGODA_AFFILIATE_ID   || '',
    bookingAid: process.env.BOOKING_AFFILIATE_ID || '',
    klookAid:   process.env.KLOOK_AFFILIATE_ID   || '',
  },
};

let runtime: Settings = clone(DEFAULTS);

function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

export function getSettings(): Settings { return runtime; }
export function getDefaults(): Settings { return DEFAULTS; }

/** Merge partial updates into runtime settings. Returns the new full settings. */
export function updateSettings(patch: Partial<Settings>): Settings {
  if (patch.ai)        runtime.ai        = { ...runtime.ai,        ...patch.ai };
  if (patch.crawler)   runtime.crawler   = { ...runtime.crawler,   ...patch.crawler,
    enabledSources: { ...runtime.crawler.enabledSources, ...(patch.crawler.enabledSources || {}) },
  };
  if (patch.affiliate) runtime.affiliate = { ...runtime.affiliate, ...patch.affiliate };
  return runtime;
}

export function resetSettings(): Settings {
  runtime = clone(DEFAULTS);
  return runtime;
}

/** Public, mask-safe view (hides API key values). */
export function getPublicSettings() {
  const s = getSettings();
  return {
    ...s,
    env: {
      OPENROUTER_API_KEY:        mask(process.env.OPENROUTER_API_KEY),
      OPENAI_API_KEY:            mask(process.env.OPENAI_API_KEY),
      GEMINI_API_KEY:            mask(process.env.GEMINI_API_KEY),
      ANTHROPIC_API_KEY:         mask(process.env.ANTHROPIC_API_KEY),
      SUPABASE_URL:              !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY:         !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      DEV_BYPASS_AUTH:           process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true',
    },
  };
}

function mask(key?: string) {
  if (!key) return null;
  if (key.length < 8) return '••••';
  return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`;
}
