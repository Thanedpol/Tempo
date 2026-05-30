import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserRole, getAdminSupabase, getServerSupabase } from '@/server/supabaseServer';
import { ENTITIES, isEntity, pickAllowed } from '@/server/entities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntity(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const cfg = ENTITIES[entity];

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let isAdmin = false;
  if (cfg.adminWrite) {
    const role = await getCurrentUserRole(user.id);
    if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    isAdmin = true;
  }

  const body = await req.json().catch(() => ({}));
  const items: any[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ data: [] });

  const rows = items.map((it) => {
    const r: Record<string, any> = pickAllowed(it, cfg.allowedColumns);
    if (cfg.userScoped) r.user_id = user.id;
    return r;
  });

  // Admin writes (e.g. seed Events) use the service-role client to bypass RLS hassles cleanly.
  const sb = isAdmin ? getAdminSupabase() : await getServerSupabase();
  const { data, error } = await sb.from(entity).insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
