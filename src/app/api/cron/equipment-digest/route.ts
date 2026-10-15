import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { emailDeliveryConfigured } from '@/lib/email/resend';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import { sendDigests } from '@/lib/equipment-listings/subscriptions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Daily letter with new listings for confirmed subscribers. */
export async function GET(request: Request) {
  if (!authorized(request)) return reply({ ok: false }, 401);
  if (!equipmentCatalogEnabled() || !emailDeliveryConfigured())
    return reply({ ok: true, skipped: true });
  try {
    return reply({ ok: true, ...(await sendDigests(100)) });
  } catch {
    return reply({ ok: false }, 503);
  }
}
