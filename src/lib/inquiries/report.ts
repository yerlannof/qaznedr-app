import type { SupabaseClient } from '@supabase/supabase-js';
import { isPublicPath } from '@/lib/analytics/attribution';
import {
  INQUIRY_CHANNELS,
  INQUIRY_STATUSES,
  type InquiryStatus,
} from './schema';
import { INQUIRY_REPORT_QA_IDS } from './report-exclusions';

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;
const MAX_ROWS = 50_000;
const COLUMNS = 'id,created_at,status,locale,channel,lead_code,source_path,utm';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface InquiryReportPeriod {
  from: string;
  to: string;
  timeZone: 'Asia/Almaty';
  fromInclusive: string;
  toExclusive: string;
  generatedAt: string;
}

export interface InquiryReportBreakdownRow {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrerHost: string | null;
  landingPath: string | null;
  sourcePath: string | null;
  leadCode: string | null;
  locale: 'ru' | 'kz' | 'en' | 'zh';
  channel: (typeof INQUIRY_CHANNELS)[number];
  status: InquiryStatus;
  count: number;
}

export interface InquiryReport {
  period: InquiryReportPeriod;
  totals: { stored: number; excludedQA: number; included: number };
  byStatus: Record<InquiryStatus, number>;
  breakdown: InquiryReportBreakdownRow[];
}

function calendarDate(value: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return new Date(utc).toISOString().slice(0, 10) === value ? utc : null;
}

/** Calendar dates in Almaty (UTC+05:00), both endpoints inclusive. */
export function parseInquiryReportPeriod(
  from: string | null,
  to: string | null,
  now: Date = new Date()
): InquiryReportPeriod | null {
  const first = calendarDate(from);
  const last = calendarDate(to);
  const current = now.getTime();
  if (first === null || last === null || !Number.isFinite(current)) return null;
  const today = new Date(current + ALMATY_OFFSET_MS).toISOString().slice(0, 10);
  if (last < first || last > (calendarDate(today) as number)) return null;
  if ((last - first) / DAY_MS + 1 > 366) return null;
  return {
    from: from!,
    to: to!,
    timeZone: 'Asia/Almaty',
    fromInclusive: new Date(first - ALMATY_OFFSET_MS).toISOString(),
    toExclusive: new Date(
      Math.min(last + DAY_MS - ALMATY_OFFSET_MS, current)
    ).toISOString(),
    generatedAt: now.toISOString(),
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function publicPath(value: unknown): string | null {
  return typeof value === 'string' &&
    value.length <= 300 &&
    /^\/(?:ru|kz|en|zh)(?:\/[A-Za-z0-9/-]*)?$/.test(value) &&
    isPublicPath(value)
    ? value
    : null;
}

function groupFor(row: Record<string, unknown>): InquiryReportBreakdownRow {
  const utm =
    row.utm && typeof row.utm === 'object' && !Array.isArray(row.utm)
      ? (row.utm as Record<string, unknown>)
      : {};
  if (
    !(INQUIRY_STATUSES as readonly unknown[]).includes(row.status) ||
    !(INQUIRY_CHANNELS as readonly unknown[]).includes(row.channel) ||
    !['ru', 'kz', 'en', 'zh'].includes(row.locale as string)
  ) {
    throw new Error('Invalid inquiry report row');
  }
  return {
    source: stringOrNull(utm.source),
    medium: stringOrNull(utm.medium),
    campaign: stringOrNull(utm.campaign),
    referrerHost: stringOrNull(utm.referrer_host),
    landingPath: publicPath(utm.landing_path),
    sourcePath: publicPath(row.source_path),
    leadCode: stringOrNull(row.lead_code),
    locale: row.locale as InquiryReportBreakdownRow['locale'],
    channel: row.channel as InquiryReportBreakdownRow['channel'],
    status: row.status as InquiryStatus,
    count: 1,
  };
}

/** Read the complete bounded set; any inconsistency aborts without a partial report. */
export async function loadInquiryReport(
  client: SupabaseClient<any>,
  period: InquiryReportPeriod
): Promise<InquiryReport> {
  const byStatus = Object.fromEntries(
    INQUIRY_STATUSES.map((status) => [status, 0])
  ) as Record<InquiryStatus, number>;
  const groups = new Map<string, InquiryReportBreakdownRow>();
  let cursor: string | null = null;
  let total: number | null = null;
  let stored = 0;
  let excludedQA = 0;
  const start = Date.parse(period.fromInclusive);
  const end = Date.parse(period.toExclusive);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error('Invalid inquiry report period');
  }

  do {
    let query = client
      .from('inquiries')
      .select(COLUMNS, { count: 'exact' })
      .gte('created_at', period.fromInclusive)
      .lt('created_at', period.toExclusive);
    if (cursor) query = query.gt('id', cursor);
    const { data, count, error } = await query
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);
    if (
      error ||
      !Array.isArray(data) ||
      !Number.isSafeInteger(count) ||
      count === null ||
      count < 0
    ) {
      throw new Error('Failed to load complete inquiry report');
    }
    if (total === null) {
      total = count;
      if (total > MAX_ROWS)
        throw new Error(
          'Inquiry report exceeds 50,000 rows; narrow the period'
        );
    }
    if (
      count !== total - stored ||
      data.length !== Math.min(PAGE_SIZE, count)
    ) {
      throw new Error('Incomplete inquiry report');
    }
    for (const raw of data) {
      const row = raw as Record<string, unknown>;
      const id = row.id;
      const createdAt = Date.parse(row.created_at as string);
      if (
        typeof id !== 'string' ||
        !UUID.test(id) ||
        (cursor && id <= cursor) ||
        !Number.isFinite(createdAt) ||
        createdAt < start ||
        createdAt >= end
      ) {
        throw new Error('Invalid inquiry report row');
      }
      cursor = id;
      stored++;
      if (INQUIRY_REPORT_QA_IDS.has(id.toLowerCase())) {
        excludedQA++;
        continue;
      }
      const entry = groupFor(row);
      byStatus[entry.status]++;
      const key = JSON.stringify([
        entry.source,
        entry.medium,
        entry.campaign,
        entry.referrerHost,
        entry.landingPath,
        entry.sourcePath,
        entry.leadCode,
        entry.locale,
        entry.channel,
        entry.status,
      ]);
      const old = groups.get(key);
      if (old) old.count++;
      else groups.set(key, entry);
    }
  } while (stored < total!);

  return {
    period,
    totals: { stored, excludedQA, included: stored - excludedQA },
    byStatus,
    breakdown: [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value),
  };
}
