import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';
import { INQUIRY_STATUSES } from '@/lib/inquiries/schema';

export const dynamic = 'force-dynamic';

// GET /api/admin/inquiries?status=NEW|CONTACTED|MEETING|DEAL|REJECTED|ALL
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const status = new URL(request.url).searchParams.get('status') || 'NEW';
  const svc = await createServiceClient();
  let q = (svc as any)
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data: data ?? [] });
}

// PATCH /api/admin/inquiries — body { id, status }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  let body: { id?: unknown; status?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // falls through to validation
  }
  const valid =
    typeof body.id === 'string' &&
    (INQUIRY_STATUSES as readonly string[]).includes(String(body.status));
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Invalid input' },
      { status: 400 }
    );
  }

  const svc = await createServiceClient();
  const { error } = await (svc as any)
    .from('inquiries')
    .update({ status: body.status })
    .eq('id', body.id);
  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
