import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/my-leads — current user's ACTIVE entitlements (unlocked leads).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;
  const svc = await createServiceClient();
  const { data, error } = await (svc as any)
    .from('lead_entitlements')
    .select(
      'id,status,watermark_token,created_at,leads:lead_id(code,teaser_title,region)'
    )
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: true, data: [] });
  return NextResponse.json({ success: true, data: data || [] });
}
