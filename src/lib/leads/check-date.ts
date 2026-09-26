import type { Locale } from '@/lib/seo/site';

/** Month of the last bulk licence-status check of the published leads. */
export const LEADS_BULK_CHECK = '2026-05';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?/;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parts(value: string | null | undefined): {
  y: string;
  m: string;
  d?: string;
} {
  const match = DATE.exec(value ?? '');
  const month = match ? Number(match[2]) : 0;
  if (match && month >= 1 && month <= 12) {
    const day = match[3] ? Number(match[3]) : 0;
    // A day that does not exist (00, 31.02) keeps the month, drops the day.
    const valid = day >= 1 && day <= daysInMonth(Number(match[1]), month);
    return { y: match[1], m: match[2], d: valid ? match[3] : undefined };
  }
  const [y, m] = LEADS_BULK_CHECK.split('-');
  return { y, m };
}

/** "Free per our check on <date>": the lead's own date or the bulk check month. */
export function formatCheckDate(
  value: string | null | undefined,
  locale: Locale
): string {
  const { y, m, d } = parts(value);
  if (locale === 'zh') {
    return d ? `${y}年${Number(m)}月${Number(d)}日` : `${y}年${Number(m)}月`;
  }
  if (locale === 'en') {
    const month = new Date(
      Date.UTC(Number(y), Number(m) - 1, 1)
    ).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
    return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
  }
  return d ? `${d}.${m}.${y}` : `${m}.${y}`;
}
