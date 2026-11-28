import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createServiceClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';

export const dynamic = 'force-dynamic';

// Gold showcase «Купить» / «Хочу эксклюзив» → lead_unlock_requests (no online payment: v1 = invoice of the LLP,
// access opened by an admin by hand). The kind goes first in the message so the admin request list shows it as is.
const KIND: Record<string, string> = {
  buy: '[Купить]',
  exclusive: '[Хочу эксклюзив — цену назвать вручную]',
};

async function handler(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const parts = req.nextUrl.pathname.split('/');
  const code = parts[parts.indexOf('gold') + 1];
  if (!/^AU-\d{4}$/.test(code || '')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }
  const tag = KIND[String(body.kind)] ?? KIND.buy;
  const message = `${tag} ${String(body.message ?? '')}`.trim().slice(0, 2000);
  const contact_phone = String(body.contact_phone ?? '').slice(0, 40);

  const svc: any = await createServiceClient();
  const { data: lead } = await svc
    .from('leads')
    .select('id')
    .eq('tier', 'GOLD_V1')
    .eq('code', code)
    .eq('status', 'MEMBERS')
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await svc.from('lead_unlock_requests').insert({
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
