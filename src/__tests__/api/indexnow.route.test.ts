/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/auth/admin', () => ({
  requireAdmin: jest.fn(),
  forbidden: jest.fn(() =>
    NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  ),
}));
jest.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: jest.fn(),
  createRateLimitResponse: jest.fn(() =>
    NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  ),
}));

import { requireAdmin } from '@/lib/auth/admin';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { GET, POST } from '@/app/api/indexnow/route';

const fetchMock = jest.fn();
const previousFetch = global.fetch;
const previousSecret = process.env.INDEXNOW_TRIGGER_SECRET;

function request(body: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest('https://qaznedr.kz/api/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  (requireAdmin as jest.Mock).mockReset().mockResolvedValue({ role: 'admin' });
  (rateLimit as jest.Mock).mockReset().mockResolvedValue(null);
  delete process.env.INDEXNOW_TRIGGER_SECRET;
});

afterAll(() => {
  global.fetch = previousFetch;
  if (previousSecret === undefined) delete process.env.INDEXNOW_TRIGGER_SECRET;
  else process.env.INDEXNOW_TRIGGER_SECRET = previousSecret;
});

describe('IndexNow submission result', () => {
  it.each([200, 202])(
    'preserves the accepted response for upstream %s',
    async (status) => {
      fetchMock.mockResolvedValue({ ok: true, status });
      const res = await POST(request(JSON.stringify({ urls: ['/zh/leads'] })));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, status, submitted: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        host: 'qaznedr.kz',
        key: 'qaznedr2026indexnow',
        keyLocation: 'https://qaznedr.kz/qaznedr2026indexnow.txt',
        urlList: ['https://qaznedr.kz/zh/leads'],
      });
    }
  );

  it.each([400, 403, 429, 500])(
    'reports upstream %s as a failed submission',
    async (status) => {
      fetchMock.mockResolvedValue({ ok: false, status });
      const res = await POST(request(JSON.stringify({ urls: ['/zh/leads'] })));
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({
        success: false,
        error: expect.any(String),
        status,
        submitted: 0,
      });
    }
  );

  it('reports a network failure without inventing an upstream status', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const res = await POST(request(JSON.stringify({ urls: ['/zh/leads'] })));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      success: false,
      error: expect.any(String),
      submitted: 0,
    });
  });

  it('rejects malformed JSON and empty or non-array URLs before fetching', async () => {
    for (const body of [
      '{broken',
      'null',
      '123',
      '{}',
      '{"urls":[]}',
      '{"urls":"/zh/leads"}',
      '{"urls":[123]}',
      '{"urls":[null]}',
      '{"urls":[""]}',
      '{"urls":["  "]}',
    ]) {
      const res = await POST(request(body));
      expect(res.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps admin, shared-secret, forbidden and rate-limit gates', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    (requireAdmin as jest.Mock).mockResolvedValueOnce(null);
    const forbidden = await POST(request('{"urls":["/zh/leads"]}'));
    expect(forbidden.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();

    process.env.INDEXNOW_TRIGGER_SECRET = 'test-secret';
    (requireAdmin as jest.Mock).mockResolvedValueOnce(null);
    const secret = await POST(
      request('{"urls":["/zh/leads"]}', { 'x-indexnow-secret': 'test-secret' })
    );
    expect(secret.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    (rateLimit as jest.Mock).mockResolvedValueOnce({
      success: false,
      limit: 10,
      reset: 1,
      remaining: 0,
    });
    const limited = await POST(request('{"urls":["/zh/leads"]}'));
    expect(limited.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('describes a current public URL and does not promise indexing', async () => {
    const json = await (await GET()).json();
    expect(json.info).toContain('/zh/leads');
    expect(json.info).not.toContain('/ru/listings/123');
    expect(json.info).toContain('not guaranteed to be indexed');
  });
});
