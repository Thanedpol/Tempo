import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/server/supabaseServer';
import { requireUser } from '@/server/guards';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;            // 10 MB
const ALLOWED = /^(image\/|application\/pdf|video\/)/;

export async function POST(req: NextRequest) {
  const g = await requireUser();
  if ('error' in g) return g.error;
  const user = g.user;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (>10MB)' }, { status: 413 });
  if (!ALLOWED.test(file.type)) return NextResponse.json({ error: `Mime not allowed: ${file.type}` }, { status: 415 });

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const path = `${user.id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = getAdminSupabase();
  const { error } = await admin.storage.from('uploads').upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = admin.storage.from('uploads').getPublicUrl(path);
  return NextResponse.json({ file_url: pub.publicUrl, path });
}
