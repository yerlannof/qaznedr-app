import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_INQUIRIES_URL, singleLine } from './notify';
import { INQUIRY_REPORT_QA_IDS } from './report-exclusions';

export interface PendingInquiry {
  id: string;
  created_at: string;
  name: string;
  channel: string;
  source_path: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const MAX_ROWS = 500;
// 20 lines of at most ~170 characters keep the text under Telegram's 4096.
const MAX_LINES = 20;

/** NEW inquiries of the last 30 days, oldest first, QA submissions excluded. */
export async function loadPendingInquiries(
  client: SupabaseClient<any>,
  now: Date = new Date()
): Promise<PendingInquiry[]> {
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString();
  const { data, error } = await client
    .from('inquiries')
    .select('id,created_at,name,channel,source_path')
    .eq('status', 'NEW')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(MAX_ROWS);
  if (error || !Array.isArray(data)) {
    throw new Error('Failed to load pending inquiries');
  }
  return (data as PendingInquiry[]).filter(
    (row) => !INQUIRY_REPORT_QA_IDS.has(String(row.id).toLowerCase())
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

const clip = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

function ageDays(createdAt: string, now: Date): number {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((now.getTime() - created) / DAY_MS));
}

/** Plain-text Russian reminder, or null when nothing is waiting. */
export function formatReminderMessage(
  rows: PendingInquiry[],
  now: Date = new Date()
): string | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
  );
  const count = rows.length;
  const lines = sorted.slice(0, MAX_LINES).map((row, index) => {
    const name = clip(singleLine(row.name ?? '') || '—', 60);
    const page = row.source_path
      ? clip(singleLine(row.source_path), 80)
      : 'страница не указана';
    return `${index + 1}. ${name} · ${row.channel} · ${page} · ${days(
      ageDays(row.created_at, now)
    )}`;
  });
  if (count > MAX_LINES) lines.push(`…и ещё ${count - MAX_LINES}`);
  return [
    `Без ответа ${count} ${plural(count, 'заявка', 'заявки', 'заявок')} (статус NEW).`,
    `Самой старой ${days(ageDays(sorted[0].created_at, now))}.`,
    '',
    ...lines,
    '',
    `Все заявки: ${ADMIN_INQUIRIES_URL}`,
  ].join('\n');
}
