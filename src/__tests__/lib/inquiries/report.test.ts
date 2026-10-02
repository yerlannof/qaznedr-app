import {
  loadInquiryReport,
  parseInquiryReportPeriod,
} from '@/lib/inquiries/report';

const NOW = new Date('2026-10-02T08:23:45.000Z');
const QA = '24e11283-e0e1-4783-9f77-b9974254cc4a';
const OTHER_QA = 'ddb66838-2540-4ee6-9d0b-ac56eed6f7ea';

function row(n: number, extra: Record<string, unknown> = {}) {
  return {
    id: n.toString(16).padStart(8, '0') + '-0000-4000-8000-000000000000',
    created_at: '2026-10-01T20:00:00.000Z',
    status: 'NEW',
    locale: 'zh',
    channel: 'wechat',
    lead_code: 'AU-123',
    source_path: '/zh/leads/AU-123',
    utm: {
      source: 'baidu',
      medium: 'organic',
      campaign: 'gold',
      landing_path: '/zh/leads',
    },
    ...extra,
  };
}

function client(
  rows: ReturnType<typeof row>[],
  options: { count?: number; failPage?: number } = {}
) {
  const calls: Array<{
    selected: string;
    count: string;
    filters: unknown[];
    order: unknown[];
    limit: number;
  }> = [];
  const from = jest.fn((_table: string) => {
    const call = {
      selected: '',
      count: '',
      filters: [] as unknown[],
      order: [] as unknown[],
      limit: 0,
    };
    calls.push(call);
    const builder = {
      select: (fields: string, opts: { count: string }) => {
        call.selected = fields;
        call.count = opts.count;
        return builder;
      },
      gte: (key: string, value: string) => {
        call.filters.push(['gte', key, value]);
        return builder;
      },
      lt: (key: string, value: string) => {
        call.filters.push(['lt', key, value]);
        return builder;
      },
      gt: (key: string, value: string) => {
        call.filters.push(['gt', key, value]);
        return builder;
      },
      order: (key: string, opts: unknown) => {
        call.order.push([key, opts]);
        return builder;
      },
      limit: (value: number) => {
        call.limit = value;
        return builder;
      },
      then: (resolve: (result: unknown) => unknown) => {
        const page = calls.length;
        const cursor = (
          call.filters.find((filter) => (filter as string[])[0] === 'gt') as
            | string[]
            | undefined
        )?.[2];
        const eligible = rows.filter((item) => !cursor || item.id > cursor);
        return Promise.resolve(
          resolve(
            options.failPage === page
              ? { data: null, error: new Error('private failure'), count: null }
              : {
                  data: eligible.slice(0, call.limit),
                  error: null,
                  count: options.count ?? eligible.length,
                }
          )
        );
      },
    };
    return builder;
  });
  return { from, calls };
}

describe('parseInquiryReportPeriod', () => {
  it('uses inclusive Almaty days and a fixed current-time cutoff', () => {
    expect(parseInquiryReportPeriod('2026-10-01', '2026-10-02', NOW)).toEqual({
      from: '2026-10-01',
      to: '2026-10-02',
      timeZone: 'Asia/Almaty',
      fromInclusive: '2026-09-30T19:00:00.000Z',
      toExclusive: NOW.toISOString(),
      generatedAt: NOW.toISOString(),
    });
    expect(
      parseInquiryReportPeriod('2026-09-30', '2026-09-30', NOW)?.toExclusive
    ).toBe('2026-09-30T19:00:00.000Z');
  });

  it('accepts leap day and 366 inclusive days, rejects invalid or future periods', () => {
    expect(
      parseInquiryReportPeriod('2024-02-29', '2024-02-29', NOW)
    ).not.toBeNull();
    expect(
      parseInquiryReportPeriod('2024-01-01', '2024-12-31', NOW)
    ).not.toBeNull();
    for (const [from, to] of [
      [null, '2026-10-01'],
      ['2026-10-01', null],
      ['2024-02-30', '2024-02-30'],
      ['2025-02-29', '2025-02-29'],
      ['2024-01-01', '2025-01-01'],
      ['2026-10-03', '2026-10-03'],
      ['2026-10-02', '2026-10-01'],
      ['2026-1-1', '2026-10-01'],
    ] as const)
      expect(parseInquiryReportPeriod(from, to, NOW)).toBeNull();
  });
});

describe('loadInquiryReport', () => {
  const period = parseInquiryReportPeriod('2026-10-01', '2026-10-02', NOW)!;

  it('returns an empty report at the exact start of the Almaty day', async () => {
    const midnight = parseInquiryReportPeriod(
      '2026-10-02',
      '2026-10-02',
      new Date('2026-10-01T19:00:00.000Z')
    )!;
    expect(midnight.fromInclusive).toBe(midnight.toExclusive);
    const report = await loadInquiryReport(client([]) as never, midnight);
    expect(report.totals).toEqual({ stored: 0, excludedQA: 0, included: 0 });
    expect(report.breakdown).toEqual([]);
  });

  it('reads every page by UUID, excludes only known QA IDs, retains REJECTED, and omits personal fields', async () => {
    const rows = Array.from({ length: 501 }, (_, n) => row(n + 1));
    rows[100] = row(101, { id: QA, status: 'REJECTED' });
    rows[200] = row(201, { id: OTHER_QA });
    rows[300] = row(301, {
      status: 'REJECTED',
      utm: { referrer_host: 'www.baidu.com' },
      lead_code: null,
    });
    rows.sort((a, b) => a.id.localeCompare(b.id));
    const db = client(rows);
    const report = await loadInquiryReport(db as never, period);
    expect(report.totals).toEqual({
      stored: 501,
      excludedQA: 2,
      included: 499,
    });
    expect(report.byStatus).toEqual({
      NEW: 498,
      CONTACTED: 0,
      MEETING: 0,
      DEAL: 0,
      REJECTED: 1,
    });
    expect(report.breakdown).toContainEqual({
      source: null,
      medium: null,
      campaign: null,
      referrerHost: 'www.baidu.com',
      landingPath: null,
      sourcePath: '/zh/leads/AU-123',
      leadCode: null,
      locale: 'zh',
      channel: 'wechat',
      status: 'REJECTED',
      count: 1,
    });
    expect(db.calls.length).toBe(2);
    for (const call of db.calls) {
      expect(call.selected).toBe(
        'id,created_at,status,locale,channel,lead_code,source_path,utm'
      );
      expect(call.count).toBe('exact');
      expect(call.limit).toBe(500);
      expect(call.filters).toContainEqual([
        'gte',
        'created_at',
        period.fromInclusive,
      ]);
      expect(call.filters).toContainEqual([
        'lt',
        'created_at',
        period.toExclusive,
      ]);
      expect(call.order).toEqual([['id', { ascending: true }]]);
    }
    expect(db.calls[1].filters).toContainEqual(['gt', 'id', rows[499].id]);
    expect(JSON.stringify(report)).not.toContain(QA);
    expect(JSON.stringify(report)).not.toContain('contact');
  });

  it('keeps missing attribution null and emits all stages', async () => {
    const db = client([
      row(1, {
        utm: null,
        status: 'DEAL',
        source_path: '/zh/contact?secret=x',
      }),
    ]);
    const report = await loadInquiryReport(db as never, period);
    expect(report.breakdown[0]).toMatchObject({
      source: null,
      medium: null,
      campaign: null,
      referrerHost: null,
      landingPath: null,
      sourcePath: null,
    });
    expect(Object.keys(report.byStatus)).toEqual([
      'NEW',
      'CONTACTED',
      'MEETING',
      'DEAL',
      'REJECTED',
    ]);
  });

  it('fails closed on count mismatch, a later read error, and the safety limit', async () => {
    await expect(
      loadInquiryReport(client([row(1)], { count: 2 }) as never, period)
    ).rejects.toThrow();
    const rows = Array.from({ length: 501 }, (_, n) => row(n + 1));
    await expect(
      loadInquiryReport(client(rows, { failPage: 2 }) as never, period)
    ).rejects.toThrow();
    await expect(
      loadInquiryReport(client([], { count: 50001 }) as never, period)
    ).rejects.toThrow(/50,?000/);
  });
});
