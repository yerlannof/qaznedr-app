import { formatCheckDate, LEADS_BULK_CHECK } from '@/lib/leads/check-date';

describe('formatCheckDate', () => {
  it('falls back to the bulk check month', () => {
    expect(LEADS_BULK_CHECK).toBe('2026-05');
    expect(formatCheckDate(null, 'ru')).toBe('05.2026');
    expect(formatCheckDate(undefined, 'kz')).toBe('05.2026');
    expect(formatCheckDate('', 'en')).toBe('May 2026');
    expect(formatCheckDate(null, 'zh')).toBe('2026年5月');
  });

  it('formats a real date and an ISO timestamp', () => {
    expect(formatCheckDate('2026-07-15', 'ru')).toBe('15.07.2026');
    expect(formatCheckDate('2026-07-15T10:00:00Z', 'en')).toBe('15 July 2026');
    expect(formatCheckDate('2026-07-15', 'zh')).toBe('2026年7月15日');
  });

  it('drops an impossible day but keeps the month of the value', () => {
    expect(formatCheckDate('2026-06-00', 'ru')).toBe('06.2026');
    expect(formatCheckDate('2026-02-31', 'ru')).toBe('02.2026');
    expect(formatCheckDate('2026-02-29', 'en')).toBe('February 2026');
    expect(formatCheckDate('2028-02-29', 'ru')).toBe('29.02.2028');
    expect(formatCheckDate('2026-04-31', 'zh')).toBe('2026年4月');
  });

  it('ignores garbage', () => {
    expect(formatCheckDate('май 2026', 'ru')).toBe('05.2026');
    expect(formatCheckDate('2026-13-40', 'ru')).toBe('05.2026');
  });
});
