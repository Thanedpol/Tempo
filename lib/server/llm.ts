/**
 * Tiny wrapper: send a prompt to the AI provider configured via env.
 * Priority: OpenRouter (default) → OpenAI → Gemini.
 * If `responseJsonSchema` is provided, attempt to JSON.parse the model's reply.
 */
export type ExtractOptions = {
  prompt: string;
  /** Optional override; otherwise use OPENROUTER_DEFAULT_MODEL / OPENAI_DEFAULT_MODEL. */
  model?: string;
  responseJsonSchema?: unknown;
  /** Hint that the prompt operates on HTML text — gives us a bit more max_tokens. */
  longContext?: boolean;
};

export async function extractWithLLM<T = any>(opts: ExtractOptions): Promise<T | string> {
  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
  const maxTokens = opts.longContext ? 6000 : 2000;

  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY not set');
    const model = opts.model || process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free';
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
        temperature: 0.2,
        max_tokens: maxTokens,
        ...(opts.responseJsonSchema
          ? { response_format: { type: 'json_object' } } // works on Gemini/OpenAI; ignored elsewhere
          : {}),
      }),
    });
    if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return parseMaybeJson<T>(content, !!opts.responseJsonSchema);
  }

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY not set');
    const model = opts.model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
        ...(opts.responseJsonSchema ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return parseMaybeJson<T>(content, !!opts.responseJsonSchema);
  }

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    const model = opts.model || process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: maxTokens,
          ...(opts.responseJsonSchema ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseMaybeJson<T>(content, !!opts.responseJsonSchema);
  }

  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}

function parseMaybeJson<T>(content: string, expectJson: boolean): T | string {
  if (!expectJson) return content;
  const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try { return JSON.parse(cleaned) as T; } catch { return content; }
}
