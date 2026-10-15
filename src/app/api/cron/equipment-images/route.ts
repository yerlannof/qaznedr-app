import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createTimedCleanupFetch,
  processImageDeletionBatch,
} from '@/lib/equipment-listings/image-cleanup';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily pass over photos the authors removed: only rows already tombstoned in
 * equipment_image_deletions are touched, so live photos are never at risk.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return reply({ ok: false }, 401);
  if (process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true')
    return reply({ ok: true, skipped: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply({ ok: false }, 503);
  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: createTimedCleanupFetch(fetch, 10_000) },
  });
  try {
    return reply({ ok: true, ...(await processImageDeletionBatch(db, 10)) });
  } catch {
    return reply({ ok: false }, 503);
  }
}
