import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, ollamaUrl, model = 'llama3.2' } =
    (await req.json().catch(() => ({}))) as { prompt?: string; ollamaUrl?: string; model?: string };

  if (!prompt)    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  if (!ollamaUrl) return NextResponse.json({ error: 'Ollama Base URL is required' }, { status: 400 });

  const baseUrl = ollamaUrl.replace(/\/$/, '');

  const r = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    return NextResponse.json({ error: `Ollama ${r.status}: ${text}` }, { status: r.status });
  }

  const data = await r.json();
  const content: string | undefined = data?.message?.content;
  if (!content) return NextResponse.json({ error: 'No response from Ollama' }, { status: 502 });

  let result: any = content;
  try {
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    result = JSON.parse(fenceMatch ? fenceMatch[1].trim() : content.trim());
  } catch {
    /* keep as plain text */
  }

  return NextResponse.json({ response: result });
}
