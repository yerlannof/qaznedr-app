import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, requireSuperAdmin, forbidden } from '@/lib/auth/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    role: z.enum(['user', 'admin', 'super_admin']).optional(),
    is_verified: z.boolean().optional(),
    is_trusted_seller: z.boolean().optional(),
  })
  .strict();

// PATCH /api/admin/users/[id]
// — verification / trusted_seller flags: any admin
// — role change: super_admin only (and cannot demote yourself)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid payload',
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const updates = parsed.data;

  // Role changes are super_admin-only and cannot target self
  if (updates.role !== undefined) {
    const sa = await requireSuperAdmin();
    if (!sa) return forbidden('Only super_admin can change roles');
    if (id === admin.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }
  }

  const supabase = await createServiceClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(
      'id, email, full_name, profile_type, role, is_verified, is_trusted_seller'
    )
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
