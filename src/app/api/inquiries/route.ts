import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { inquirySchema, isLikelySpam } from '@/lib/inquiries/schema';
import { createThrottle } from '@/lib/inquiries/throttle';
import { formatInquiryMessage, notifyTelegram } from '@/lib/inquiries/notify';

export const dynamic = 'force-dynamic';

const allow = createThrottle({ limit: 5, windowMs: 10 * 60 * 1000 });

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

// Public, login-free inquiry capture → inquiries table (service role only).
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!allow(clientIp(req))) {
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'invalid' },
      { status: 400 }
    );
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'invalid' },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Pretend success so bots get no signal.
  if (isLikelySpam(input)) return NextResponse.json({ success: true });

  const svc = await createServiceClient();
  const { data, error } = await (svc as any)
    .from('inquiries')
    .insert({
      lead_code: input.leadCode ?? null,
      name: input.name,
      company: input.company || null,
      country: input.country || null,
      channel: input.channel,
      contact: input.contact,
      message: input.message || null,
      locale: input.locale,
      source_path: input.sourcePath || null,
      utm: input.utm ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'failed' },
      { status: 500 }
    );
  }

  await notifyTelegram(formatInquiryMessage(input, data.id));
  return NextResponse.json({ success: true });
}
