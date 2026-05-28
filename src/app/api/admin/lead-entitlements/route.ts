import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';
import { watermarkToken } from '@/lib/leads/watermark';

export const dynamic = 'force-dynamic';

// POST /api/admin/lead-entitlements — grant access.
// Body: { lead_id, user_id, grant_reason?, request_id? }
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const body = await request.json();
  const { lead_id, user_id } = body;
  if (!lead_id || !user_id) {
    return NextResponse.json(
      { success: false, error: 'lead_id and user_id required' },
      { status: 400 }
    );
  }

  const svc = await createServiceClient();
  const token = watermarkToken(user_id, lead_id);

  const { error } = await (svc as any).from('lead_entitlements').upsert(
    {
      lead_id,
      user_id,
      granted_by: admin.userId,
      grant_reason: body.grant_reason || 'ADMIN_MANUAL',
      watermark_token: token,
      status: 'ACTIVE',
    },
    { onConflict: 'lead_id,user_id' }
  );
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // Exclusive lead → mark SOLD so it can't be sold twice.
  const { data: lead } = await (svc as any)
    .from('leads')
    .select('exclusivity')
    .eq('id', lead_id)
    .maybeSingle();
  if (lead?.exclusivity === 'EXCLUSIVE') {
    await (svc as any)
      .from('leads')
      .update({ status: 'SOLD' })
      .eq('id', lead_id);
  }

  if (body.request_id) {
    await (svc as any)
      .from('lead_unlock_requests')
      .update({ status: 'DEAL' })
      .eq('id', body.request_id);
  }

  return NextResponse.json({ success: true, watermark_token: token });
}

// DELETE /api/admin/lead-entitlements — revoke. Body: { id } or { lead_id, user_id }
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const body = await request.json();
  const svc = await createServiceClient();
  let q = (svc as any).from('lead_entitlements').update({ status: 'REVOKED' });
  if (body.id) q = q.eq('id', body.id);
  else if (body.lead_id && body.user_id)
    q = q.eq('lead_id', body.lead_id).eq('user_id', body.user_id);
  else
    return NextResponse.json(
      { success: false, error: 'id or (lead_id,user_id) required' },
      { status: 400 }
    );

  const { error } = await q;
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
