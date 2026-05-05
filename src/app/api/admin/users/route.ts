import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — list all profiles. Available to admin and super_admin.
// Query params: ?role=admin|user|super_admin, ?search=
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get('role');
  const search = searchParams.get('search')?.toLowerCase().trim();

  const supabase = await createServiceClient();
  let query = (supabase as any)
    .from('profiles')
    .select(
      'id, email, full_name, profile_type, role, company_name, country, city, is_verified, is_trusted_seller, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  let users = (data ?? []) as any[];

  if (search) {
    users = users.filter((u) => {
      const haystack = [u.full_name, u.email, u.company_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  return NextResponse.json({
    success: true,
    data: users,
    currentRole: admin.role,
  });
}
