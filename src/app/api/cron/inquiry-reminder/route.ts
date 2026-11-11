import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyTelegramWithRetry } from '@/lib/inquiries/deliver';
import {
  formatReminderMessage,
  loadPendingInquiries,
} from '@/lib/inquiries/reminder';

export const dynamic = 'force-dynamic';

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

/** Morning reminder (09:00 Almaty) about inquiries still in status NEW. */
export async function GET(request: Request) {
  if (!authorized(request)) return reply({ ok: false }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply({ ok: false }, 503);
  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let pending;
  try {
    pending = await loadPendingInquiries(db);
  } catch {
    return reply({ ok: false }, 503);
  }
  const text = formatReminderMessage(pending);
  if (!text) return reply({ ok: true, pending: 0 });
  const sent = await notifyTelegramWithRetry(text, {
    context: { job: 'inquiry-reminder' },
  });
  return sent
    ? reply({ ok: true, pending: pending.length })
    : reply({ ok: false, pending: pending.length }, 503);
}
