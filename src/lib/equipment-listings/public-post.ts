import 'server-only';
import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo/site';

export const publicReply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

export const clientIp = (request: Request) =>
  request.headers.get('x-real-ip')?.trim() ||
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
  'unknown';

/**
 * Same-site JSON body for anonymous visitor actions. Returns a ready error
 * response instead of throwing so routes stay flat.
 */
export async function readPublicJson(
  request: Request,
  maxBytes = 4096
): Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  const allowedOrigin = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  if (
    request.headers.get('origin') !== allowedOrigin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return { error: publicReply({ status: 'forbidden' }, 403) };
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return { error: publicReply({ status: 'invalid' }, 415) };
  try {
    const raw = await request.text();
    if (raw.length > maxBytes)
      return { error: publicReply({ status: 'invalid' }, 413) };
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return { error: publicReply({ status: 'invalid' }, 400) };
    return { body };
  } catch {
    return { error: publicReply({ status: 'invalid' }, 400) };
  }
}
