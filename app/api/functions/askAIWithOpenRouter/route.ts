import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/supabaseServer';
import { getEffectiveKey } from '@/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, model = 'meta-llama/llama-3.3-70b-instruct:free', response_json_schema } =
    (await req.json().catch(() => ({}))) as { prompt?: string; model?: string; response_json_schema?: unknown };

  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

  const apiKey = getEffectiveKey('openrouter');
  if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });

  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Tempo AI Hub',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      top_p: 1,
      max_tokens: 2000,
    }),
  });

  if (!r.ok) {
    const errJson = await r.json().catch(() => ({}));
    return NextResponse.json({ error: errJson?.error?.message || `OpenRouter ${r.status}` }, { status: r.status });
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return NextResponse.json({ error: 'No response from model' }, { status: 502 });

  let result: any = content;
  if (response_json_schema) {
    try { result = JSON.parse(content); } catch { /* keep as text */ }
  }
  return NextResponse.json({ response: result });
}
