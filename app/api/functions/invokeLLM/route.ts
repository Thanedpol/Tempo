import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/supabaseServer';
import { extractWithLLM } from '@/server/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, model } = body as any;
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  try {
    const result = await extractWithLLM({ prompt, responseJsonSchema: response_json_schema, model });
    return NextResponse.json(typeof result === 'string' ? { response: result } : result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'LLM error' }, { status: 500 });
  }
}
