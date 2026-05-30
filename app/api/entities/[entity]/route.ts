import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserRole, getServerSupabase } from '@/server/supabaseServer';
import { ENTITIES, isEntity, parseOrder, pickAllowed } from '@/server/entities';
import { memList, memUpsert } from '@/server/memStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ------------------------------------------------------------- GET /list
export async function GET(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];

  const user = await getCurrentUser();
  if (!cfg.publicRead && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { column, ascending } = parseOrder(searchParams.get('order'));
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  const sb = await getServerSupabase();
  if (!sb) {
    // Dev / no-Supabase: read from in-process store (auto-seeded for `events`).
    const data = await memList(entity, limit);
    return NextResponse.json({ data });
  }
  const { data, error } = await sb
    .from(entity)
    .select('*')
    .order(column, { ascending })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Front-end expects an `id` and `created_date` on every row — our schema already provides both.
  return NextResponse.json({ data });
}

// ------------------------------------------------------------- POST /create
export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (cfg.adminWrite) {
    const role = await getCurrentUserRole(user.id);
    if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, any> = pickAllowed(body, cfg.allowedColumns);
  if (cfg.userScoped) payload.user_id = user.id;

  const sb = await getServerSupabase();
  if (!sb) {
    // dev/no-Supabase → persist into memstore (so subsequent lists include it)
    const data = memUpsert(entity, payload);
    return NextResponse.json({ data });
  }
  const { data, error } = await sb.from(entity).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
