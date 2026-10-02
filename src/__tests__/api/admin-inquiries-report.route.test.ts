/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/inquiries/report', () => ({
  parseInquiryReportPeriod: jest.fn(),
  loadInquiryReport: jest.fn(),
}));

import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import {
  parseInquiryReportPeriod,
  loadInquiryReport,
} from '@/lib/inquiries/report';
import { GET } from '@/app/api/admin/inquiries/report/route';

const request = (query = '?from=2026-09-26&to=2026-09-30') =>
  new NextRequest(`https://qaznedr.kz/api/admin/inquiries/report${query}`);
const period = {
  from: '2026-09-26',
  to: '2026-09-30',
  timeZone: 'Asia/Almaty',
  fromInclusive: '2026-09-25T19:00:00.000Z',
  toExclusive: '2026-09-30T19:00:00.000Z',
  generatedAt: '2026-10-02T05:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue({ role: 'admin' });
  (parseInquiryReportPeriod as jest.Mock).mockReturnValue(period);
  (createServiceClient as jest.Mock).mockResolvedValue({ from: jest.fn() });
  (loadInquiryReport as jest.Mock).mockResolvedValue({
    period,
    totals: { stored: 703, excludedQA: 2, included: 701 },
    byStatus: { NEW: 701, CONTACTED: 0, MEETING: 0, DEAL: 0, REJECTED: 0 },
    breakdown: [],
  });
});

function expectPrivate(headers: Headers) {
  expect(headers.get('cache-control')).toBe('private, no-store');
  expect(headers.get('x-robots-tag')).toBe('noindex, nofollow');
  expect(headers.get('x-content-type-options')).toBe('nosniff');
}

it('rejects unauthenticated/non-admin callers before reading data', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue(null);
  const res = await GET(request());
  expect(res.status).toBe(403);
  expectPrivate(res.headers);
  expect(createServiceClient).not.toHaveBeenCalled();
  expect(loadInquiryReport).not.toHaveBeenCalled();
});

it('rejects invalid or missing calendar dates before opening DB', async () => {
  (parseInquiryReportPeriod as jest.Mock).mockReturnValue(null);
  const res = await GET(request(''));
  expect(res.status).toBe(400);
  expectPrivate(res.headers);
  expect(parseInquiryReportPeriod).toHaveBeenCalledWith(null, null);
  expect(createServiceClient).not.toHaveBeenCalled();
});

it('returns the complete shared aggregate, not the 200-row inbox list', async () => {
  const res = await GET(request());
  expect(res.status).toBe(200);
  expectPrivate(res.headers);
  expect(parseInquiryReportPeriod).toHaveBeenCalledWith(
    '2026-09-26',
    '2026-09-30'
  );
  expect(loadInquiryReport).toHaveBeenCalledWith(
    await (createServiceClient as jest.Mock).mock.results[0].value,
    period
  );
  expect((await res.json()).data.totals).toEqual({
    stored: 703,
    excludedQA: 2,
    included: 701,
  });
});

it.each(['admin', 'client', 'report'])(
  'fails closed on %s errors',
  async (step) => {
    const target =
      step === 'admin'
        ? requireAdmin
        : step === 'client'
          ? createServiceClient
          : loadInquiryReport;
    (target as jest.Mock).mockRejectedValueOnce(
      new Error('private-contact-and-service-key')
    );
    const res = await GET(request());
    expect(res.status).toBe(500);
    expectPrivate(res.headers);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(
      'private-contact-and-service-key'
    );
  }
);
