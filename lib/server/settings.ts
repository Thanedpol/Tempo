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

// ─── Runtime API keys (admin can paste a key in the UI without redeploying) ──
// NOTE: in-process only — resets on restart / not shared across serverless
// instances. For permanent prod keys, set the env vars below in Vercel.
const runtimeKeys: Record<string, string> = {};
const ENV_BY_PROVIDER: Record<string, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  openai:     'OPENAI_API_KEY',
  anthropic:  'ANTHROPIC_API_KEY',
  gemini:     'GEMINI_API_KEY',
};

export function setRuntimeKey(provider: string, value: string) {
  if (!ENV_BY_PROVIDER[provider]) return;
  if (value && value.trim()) runtimeKeys[provider] = value.trim();
  else delete runtimeKeys[provider];
}

/** Effective key = key pasted in the UI (runtime) wins, else the env var. */
export function getEffectiveKey(provider: string): string {
  const envName = ENV_BY_PROVIDER[provider];
  return runtimeKeys[provider] || (envName ? process.env[envName] : '') || '';
}

/** Merge partial updates into runtime settings. Returns the new full settings. */
export function updateSettings(patch: Partial<Settings> & { keys?: Record<string, string> }): Settings {
  if (patch.ai)        runtime.ai        = { ...runtime.ai,        ...patch.ai };
  if (patch.crawler)   runtime.crawler   = { ...runtime.crawler,   ...patch.crawler,
    enabledSources: { ...runtime.crawler.enabledSources, ...(patch.crawler.enabledSources || {}) },
  };
  if (patch.affiliate) runtime.affiliate = { ...runtime.affiliate, ...patch.affiliate };
  if (patch.keys)      for (const [k, v] of Object.entries(patch.keys)) setRuntimeKey(k, String(v ?? ''));
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
      OPENROUTER_API_KEY:        mask(getEffectiveKey('openrouter')),
      OPENAI_API_KEY:            mask(getEffectiveKey('openai')),
      GEMINI_API_KEY:            mask(getEffectiveKey('gemini')),
      ANTHROPIC_API_KEY:         mask(getEffectiveKey('anthropic')),
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
