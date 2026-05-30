import { NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserRole } from './supabaseServer';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { user };
}

export async function requireAdmin() {
  const u = await requireUser();
  if ('error' in u) return u;
  const role = await getCurrentUserRole(u.user.id);
  if (role !== 'admin') return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) };
  return { user: u.user };
}
