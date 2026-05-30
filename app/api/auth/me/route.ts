import { NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserRole } from '@/server/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const role = await getCurrentUserRole(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      role,
    },
  });
}
