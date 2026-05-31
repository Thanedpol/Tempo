import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/guards';
import { getSettings, getEffectiveKey } from '@/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Lightweight LLM ping — sends a 1-word prompt to the currently-configured
 * provider+model and reports latency + response. Used by Settings "Test" button.
 */
export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if ('error' in g) return g.error;

  const body = await req.json().catch(() => ({}));
  const { provider: overrideProvider, model: overrideModel } = body;

  const cfg = getSettings().ai;
  const provider = overrideProvider || cfg.provider;
  const model    = overrideModel    || cfg.model;

  const startedAt = Date.now();
  try {
    let text = '';
    if (provider === 'openrouter') {
      const key = getEffectiveKey('openrouter');
      if (!key) throw new Error('OpenRouter API key not set (paste it in the AI tab or set OPENROUTER_API_KEY)');
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Respond with the single word: pong' }], max_tokens: 16 }),
      });
      if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${await r.text()}`);
      const data = await r.json();
      text = data?.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'openai') {
      const key = getEffectiveKey('openai');
      if (!key) throw new Error('OpenAI API key not set (paste it in the AI tab or set OPENAI_API_KEY)');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Respond with the single word: pong' }], max_tokens: 16 }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      const data = await r.json();
      text = data?.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'gemini') {
      const key = getEffectiveKey('gemini');
      if (!key) throw new Error('Gemini API key not set (paste it in the AI tab or set GEMINI_API_KEY)');
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Respond with the single word: pong' }] }] }),
      });
      if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
      const data = await r.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } else if (provider === 'anthropic') {
      const key = getEffectiveKey('anthropic');
      if (!key) throw new Error('Anthropic API key not set (paste it in the AI tab or set ANTHROPIC_API_KEY)');
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 16, messages: [{ role: 'user', content: 'Respond with the single word: pong' }] }),
      });
      if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
      const data = await r.json();
      text = data?.content?.[0]?.text ?? '';
    } else if (provider === 'ollama') {
      const url = cfg.ollamaUrl || 'http://localhost:11434';
      const r = await fetch(`${url.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Respond with the single word: pong' }], stream: false }),
      });
      if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
      const data = await r.json();
      text = data?.message?.content ?? '';
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return NextResponse.json({
      ok: true,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
      response: text.slice(0, 200),
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
      error: e?.message || String(e),
    }, { status: 200 });           // 200 so frontend gets the error JSON directly
  }
}
