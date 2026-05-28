import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/leads?status=ALL|DRAFT|PUBLISHED|SOLD|ARCHIVED
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const status = new URL(request.url).searchParams.get('status') || 'ALL';
  const svc = await createServiceClient();
  let q = (svc as any)
    .from('leads')
    .select(
      'id,code,teaser_title,region,mineral,tier,exclusivity,license_status,status,price_display,confidence,sold_count,created_at,published_at'
    )
    .order('created_at', { ascending: false });
  if (status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/admin/leads — create a lead (teaser fields). Defaults to DRAFT.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const body = await request.json();
  const svc = await createServiceClient();
  const { data, error } = await (svc as any)
    .from('leads')
    .insert([{ ...body, status: body.status ?? 'DRAFT' }])
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data }, { status: 201 });
}
