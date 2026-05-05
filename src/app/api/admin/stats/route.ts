import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const supabase = await createServiceClient();

  const [pending, active, total, users, admins] = await Promise.all([
    (supabase as any)
      .from('kazakhstan_deposits')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING_MODERATION'),
    (supabase as any)
      .from('kazakhstan_deposits')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    (supabase as any)
      .from('kazakhstan_deposits')
      .select('id', { count: 'exact', head: true }),
    (supabase as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true }),
    (supabase as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['admin', 'super_admin']),
  ]);

  return NextResponse.json({
    success: true,
    role: admin.role,
    data: {
      pendingListings: pending.count ?? 0,
      activeListings: active.count ?? 0,
      totalListings: total.count ?? 0,
      totalUsers: users.count ?? 0,
      adminCount: admins.count ?? 0,
    },
  });
}
