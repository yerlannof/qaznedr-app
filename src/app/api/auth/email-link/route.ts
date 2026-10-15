import { NextResponse } from 'next/server';
import { emailLinkEnabled, requestEmailLink } from '@/lib/auth/email-link';
import { SITE_URL } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

const reply = (status: string, code = 200) =>
  NextResponse.json(
    { status },
    {
      status: code,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );

export async function POST(request: Request) {
  if (!emailLinkEnabled()) return reply('unavailable', 404);
  // Check a configured origin, never a caller-controlled Host/forwarded header.
  const allowedOrigin = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  if (
    request.headers.get('origin') !== allowedOrigin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return reply('forbidden', 403);
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return reply('invalid', 415);

  let body: { email?: unknown; locale?: unknown; callbackUrl?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply('invalid', 413);
    body = JSON.parse(raw);
  } catch {
    return reply('invalid', 400);
  }
  if (!body || typeof body !== 'object') return reply('invalid', 400);

  const ip =
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';
  try {
    const result = await requestEmailLink({
      email: body.email,
      ip,
      locale: typeof body.locale === 'string' ? body.locale : 'ru',
      callbackPath: body.callbackUrl,
    });
    if (result === 'invalid') return reply('invalid', 400);
    if (result === 'rate_limited') return reply('rate_limited', 429);
    return reply('sent');
  } catch {
    // Neither the address nor provider errors are echoed back.
    return reply('failed', 502);
  }
}
