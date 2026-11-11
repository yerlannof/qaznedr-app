/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/inquiries/deliver', () => ({
  notifyTelegramWithRetry: jest.fn().mockResolvedValue(true),
}));

import { createServiceClient } from '@/lib/supabase/server';
import { notifyTelegramWithRetry as notifyTelegram } from '@/lib/inquiries/deliver';
import { POST } from '@/app/api/inquiries/route';

const valid = {
  name: 'Li Wei',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
  elapsedMs: 9000,
};

function req(body: unknown, ip: string) {
  return new NextRequest('https://qaznedr.kz/api/inquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

let insert: jest.Mock;

beforeEach(() => {
  insert = jest.fn().mockReturnValue({
    select: () => ({
      single: async () => ({ data: { id: 'uuid-1' }, error: null }),
    }),
  });
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: jest.fn().mockReturnValue({ insert }),
  });
  (notifyTelegram as jest.Mock).mockClear();
});

describe('POST /api/inquiries', () => {
  it('stores a valid inquiry and notifies Telegram', async () => {
    const res = await POST(req(valid, '10.0.0.1'));
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_code: 'AU-508A4C',
        name: 'Li Wei',
        channel: 'wechat',
        contact: 'liwei_88',
        locale: 'zh',
      })
    );
    expect(notifyTelegram).toHaveBeenCalledTimes(1);
    const [text, options] = (notifyTelegram as jest.Mock).mock.calls[0];
    expect(text).toContain('Новая заявка с qaznedr.kz');
    expect(text).toContain('ID: uuid-1');
    expect(options).toEqual({ context: { inquiryId: 'uuid-1' } });
  });

  it('answers the visitor without waiting for Telegram (retry runs after the response)', async () => {
    (notifyTelegram as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    const res = await POST(req(valid, '10.0.0.6'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(notifyTelegram).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed JSON and invalid bodies with 400', async () => {
    expect((await POST(req('{oops', '10.0.0.2'))).status).toBe(400);
    expect(
      (await POST(req({ ...valid, channel: 'fax' }, '10.0.0.2'))).status
    ).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('silently drops honeypot spam', async () => {
    const res = await POST(req({ ...valid, website: 'x' }, '10.0.0.3'));
    expect(res.status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
    expect(notifyTelegram).not.toHaveBeenCalled();
  });

  it('still succeeds when Telegram is down', async () => {
    (notifyTelegram as jest.Mock).mockResolvedValueOnce(false);
    expect((await POST(req(valid, '10.0.0.4'))).status).toBe(200);
    expect(insert).toHaveBeenCalled();
  });

  it('returns 500 when the insert fails', async () => {
    insert.mockReturnValue({
      select: () => ({
        single: async () => ({ data: null, error: { message: 'x' } }),
      }),
    });
    expect((await POST(req(valid, '10.0.0.5'))).status).toBe(500);
    expect(notifyTelegram).not.toHaveBeenCalled();
  });

  it('returns 429 after 5 requests from one IP within 10 minutes', async () => {
    for (let i = 0; i < 5; i++) await POST(req(valid, '10.0.0.9'));
    expect((await POST(req(valid, '10.0.0.9'))).status).toBe(429);
  });
});
