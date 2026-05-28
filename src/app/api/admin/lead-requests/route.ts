import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/lead-requests?status=NEW|ALL|CONTACTED|DEAL|REJECTED
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const status = new URL(request.url).searchParams.get('status') || 'NEW';
  const svc = await createServiceClient();
  // lead_id has a FK to leads → PostgREST can embed it. user_id has no FK (NextAuth id).
  let q = (svc as any)
    .from('lead_unlock_requests')
    .select(
      'id,lead_id,user_id,message,contact_phone,status,created_at,leads:lead_id(code,teaser_title)'
    )
    .order('created_at', { ascending: false });
  if (status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    let fq = (svc as any)
      .from('lead_unlock_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (status !== 'ALL') fq = fq.eq('status', status);
    const { data: fd } = await fq;
    return NextResponse.json({ success: true, data: fd || [] });
  }
  return NextResponse.json({ success: true, data: data || [] });
}

// PATCH /api/admin/lead-requests — update a request's status. Body: { id, status }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const body = await request.json();
  const ALLOWED = ['NEW', 'CONTACTED', 'DEAL', 'REJECTED'];
  if (!body.id || !ALLOWED.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid input' },
      { status: 400 }
    );
  }
  const svc = await createServiceClient();
  const { error } = await (svc as any)
    .from('lead_unlock_requests')
    .update({ status: body.status })
    .eq('id', body.id);
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
