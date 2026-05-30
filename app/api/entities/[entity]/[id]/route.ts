import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserRole, getServerSupabase } from '@/server/supabaseServer';
import { ENTITIES, isEntity, pickAllowed } from '@/server/entities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];
  const user = await getCurrentUser();
  if (!cfg.publicRead && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await sb.from(entity).select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (cfg.adminWrite) {
    const role = await getCurrentUserRole(user.id);
    if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const patch = pickAllowed(body, cfg.allowedColumns);

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ data: { id, ...patch } });   // dev mode → echo back
  const { data, error } = await sb.from(entity).update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (cfg.adminWrite) {
    const role = await getCurrentUserRole(user.id);
    if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ ok: true });   // dev mode → pretend delete worked
  const { error } = await sb.from(entity).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
