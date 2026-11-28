import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

const ALLOWED = ['DRAFT', 'PUBLISHED', 'MEMBERS', 'SOLD', 'ARCHIVED'];

// PATCH /api/admin/leads/[id] — change lead status (publish/unpublish/archive).
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const parts = request.nextUrl.pathname.split('/');
  const id = parts[parts.indexOf('leads') + 1];
  const body = await request.json();
  const status = body.status as string;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid status' },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'PUBLISHED') patch.published_at = new Date().toISOString();

  const svc = await createServiceClient();
  // Gold showcase rows (tier GOLD_V1) are for signed-in users only: PUBLISHED would open them to the anon RLS
  // policy and the public lists. They move only between MEMBERS, SOLD, ARCHIVED and DRAFT.
  const { data: cur } = await (svc as any)
    .from('leads')
    .select('tier')
    .eq('id', id)
    .maybeSingle();
  const goldOk = ['MEMBERS', 'SOLD', 'ARCHIVED', 'DRAFT'];
  if (
    cur?.tier === 'GOLD_V1' ? !goldOk.includes(status) : status === 'MEMBERS'
  ) {
    return NextResponse.json(
      { success: false, error: 'Status not allowed for this lead' },
      { status: 400 }
    );
  }
  const { error } = await (svc as any).from('leads').update(patch).eq('id', id);
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/leads/[id] — soft archive.
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();
  const parts = request.nextUrl.pathname.split('/');
  const id = parts[parts.indexOf('leads') + 1];
  const svc = await createServiceClient();
  const { error } = await (svc as any)
    .from('leads')
    .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
