/**
 * Unified LLM call — routes to whichever provider the admin configured in
 * Settings (runtime settings), falling back to env. Supports all 5 providers:
 * OpenRouter, OpenAI, Anthropic, Gemini, Ollama.
 *
 * Key resolution per call: opts.apiKey  >  opts.keys[provider]  >  getEffectiveKey(provider)
 * (so a key pasted in the UI / sent from the browser works on serverless, and
 * env keys work in production).
 */
import { getSettings, getEffectiveKey } from './settings';

export type ExtractOptions = {
  prompt: string;
  model?: string;
  responseJsonSchema?: unknown;
  longContext?: boolean;           // scrapers: bigger token budget, low temperature
  provider?: string;               // override the configured provider
  apiKey?: string;                 // single explicit key override
  keys?: Record<string, string>;   // per-provider keys sent from the client
  ollamaUrl?: string;              // override Ollama base URL
  temperature?: number;
  maxTokens?: number;
};

function defaultModel(provider: string): string {
  switch (provider) {
    case 'openrouter': return process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free';
    case 'openai':     return process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
    case 'anthropic':  return 'claude-3-5-sonnet-latest';
    case 'gemini':     return process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash';
    case 'poe':        return process.env.POE_DEFAULT_MODEL || 'GPT-4o-mini';
    case 'ollama':     return 'llama3.2';
    default:           return 'google/gemini-2.0-flash-exp:free';
  }
}

export async function extractWithLLM<T = any>(opts: ExtractOptions): Promise<T | string> {
  const ai = getSettings().ai;
  const provider = (opts.provider || ai.provider || process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
  const model = opts.model || ai.model || defaultModel(provider);
  const expectJson = !!opts.responseJsonSchema;
  const maxTokens = opts.maxTokens ?? (opts.longContext ? 6000 : (ai.maxTokens || 2000));
  // scrapers (longContext) stay deterministic; chat uses the configured temperature
  const temperature = opts.temperature ?? (opts.longContext ? 0.2 : (typeof ai.temperature === 'number' ? ai.temperature : 0.7));
  const key = (opts.apiKey && opts.apiKey.trim()) || opts.keys?.[provider] || getEffectiveKey(provider);

  if (provider === 'ollama') {
    const url = (opts.ollamaUrl || ai.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
    const r = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, stream: false,
        messages: [{ role: 'user', content: opts.prompt }],
        options: { temperature },
        ...(expectJson ? { format: 'json' } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
    const data = await r.json();
    return parseMaybeJson<T>(data?.message?.content ?? '', expectJson);
  }

  if (!key) throw new Error(`${provider} API key not set (paste it in Admin → AI, or set the env var)`);

  if (provider === 'openrouter') {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Tempo AI Hub',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature, max_tokens: maxTokens,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
    const data = await r.json();
    return parseMaybeJson<T>(data?.choices?.[0]?.message?.content ?? '', expectJson);
  }

  // OpenAI + Poe share the OpenAI-compatible Chat Completions shape.
  if (provider === 'openai' || provider === 'poe') {
    const base = provider === 'poe' ? 'https://api.poe.com/v1' : 'https://api.openai.com/v1';
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature, max_tokens: maxTokens,
        // Poe bots may not accept response_format — rely on prompt + parseMaybeJson there.
        ...(expectJson && provider === 'openai' ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`${provider === 'poe' ? 'Poe' : 'OpenAI'} ${r.status}: ${await r.text()}`);
    const data = await r.json();
    return parseMaybeJson<T>(data?.choices?.[0]?.message?.content ?? '', expectJson);
  }

  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, max_tokens: maxTokens, temperature,
        messages: [{ role: 'user', content: opts.prompt }],
      }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
    const data = await r.json();
    return parseMaybeJson<T>(data?.content?.[0]?.text ?? '', expectJson);
  }

  if (provider === 'gemini') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature, maxOutputTokens: maxTokens,
          ...(expectJson ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
    const data = await r.json();
    return parseMaybeJson<T>(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '', expectJson);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

function parseMaybeJson<T>(content: string, expectJson: boolean): T | string {
  if (!expectJson) return content;
  const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try { return JSON.parse(cleaned) as T; } catch { return content; }
}
