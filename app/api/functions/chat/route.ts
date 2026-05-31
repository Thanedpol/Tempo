import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/supabaseServer';
import { getSettings } from '@/server/settings';
import { extractWithLLM } from '@/server/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Chat endpoint used by the AI Assistant. Routes to whichever provider the admin
 * configured (OpenRouter / OpenAI / Anthropic / Gemini / Ollama), applies the
 * configured system prompt, and uses keys sent from the client (localStorage)
 * or the backend/env key. Returns `{ response }` to match the old shape the
 * ChatInterface expects.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, keys, ollamaUrl, provider, model, system } = body as {
    prompt?: string;
    response_json_schema?: unknown;
    keys?: Record<string, string>;
    ollamaUrl?: string;
    provider?: string;
    model?: string;
    system?: string;
  };
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const ai = getSettings().ai;
  // Client-supplied config (mirrored from Admin) wins; fall back to backend/env.
  const sys = (typeof system === 'string' ? system : (ai.systemPrompt || '')).trim();
  const fullPrompt = sys ? `${sys}\n\n${prompt}` : prompt;

  try {
    const result = await extractWithLLM({
      prompt: fullPrompt,
      responseJsonSchema: response_json_schema,
      provider: provider || undefined,
      model: model || undefined,
      keys,
      ollamaUrl,
    });
    return NextResponse.json({ response: result, provider: provider || ai.provider, model: model || ai.model });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'LLM error' }, { status: 502 });
  }
}
