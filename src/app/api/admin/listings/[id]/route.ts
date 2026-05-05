import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = [
  'ACTIVE',
  'PENDING',
  'PENDING_MODERATION',
  'REJECTED',
  'SOLD',
  'EXPIRED',
  'DRAFT',
] as const;

const updateSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(5000).optional(),
    type: z
      .enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE'])
      .optional(),
    mineral: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    city: z.string().optional(),
    area: z.number().positive().optional(),
    price: z.number().positive().nullable().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(ALLOWED_STATUSES).optional(),
    verified: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .strict();

// GET /api/admin/listings/[id] — fetch single listing for admin edit
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await (supabase as any)
    .from('kazakhstan_deposits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/admin/listings/[id] — edit listing fields, change status, toggle featured/verified
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

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid update payload',
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  const updates = validation.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No fields to update' },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();
  const { data, error } = await (supabase as any)
    .from('kazakhstan_deposits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// DELETE /api/admin/listings/[id] — soft delete (status = 'DELETED')
// Pass ?hard=true to actually remove from DB (super_admin only check could be added)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hardDelete =
    searchParams.get('hard') === 'true' && admin.role === 'super_admin';

  const supabase = await createServiceClient();

  if (hardDelete) {
    const { error } = await (supabase as any)
      .from('kazakhstan_deposits')
      .delete()
      .eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, mode: 'hard' });
  }

  const { error } = await (supabase as any)
    .from('kazakhstan_deposits')
    .update({ status: 'DELETED', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, mode: 'soft' });
}
