import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createServiceClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';

export const dynamic = 'force-dynamic';

// Auth-required interest capture → lead_unlock_requests. Rate-limited ('payments' bucket).
async function handler(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const parts = req.nextUrl.pathname.split('/');
  const code = parts[parts.indexOf('leads') + 1];

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }
  const message = String(body.message ?? '').slice(0, 2000);
  const contact_phone = String(body.contact_phone ?? '').slice(0, 40);

  const svc = await createServiceClient();
  const { data: lead } = await (svc as any)
    .from('leads')
    .select('id')
    .eq('code', code)
    .eq('status', 'PUBLISHED')
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await (svc as any).from('lead_unlock_requests').insert({
    lead_id: lead.id,
    user_id: userId,
    message,
    contact_phone,
    status: 'NEW',
  });
  if (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export const POST = withRateLimit(handler, 'payments');
