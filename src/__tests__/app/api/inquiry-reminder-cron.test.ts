/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { GET } from '@/app/api/cron/inquiry-reminder/route';
import { loadPendingInquiries } from '@/lib/inquiries/reminder';
import { notifyTelegramWithRetry } from '@/lib/inquiries/deliver';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({})),
}));
jest.mock('@/lib/inquiries/reminder', () => ({
  ...jest.requireActual('@/lib/inquiries/reminder'),
  loadPendingInquiries: jest.fn(),
}));
jest.mock('@/lib/inquiries/deliver', () => ({
  notifyTelegramWithRetry: jest.fn(),
}));

const secret = 's'.repeat(40);
const call = (auth?: string) =>
  GET(
    new Request('https://qaznedr.kz/api/cron/inquiry-reminder', {
      headers: auth ? { authorization: auth } : {},
    })
  );
const load = loadPendingInquiries as jest.Mock;
const send = notifyTelegramWithRetry as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = secret;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
});

it('refuses calls without the cron secret', async () => {
  expect((await call()).status).toBe(401);
  expect((await call('Bearer wrong')).status).toBe(401);
  delete process.env.CRON_SECRET;
  expect((await call(`Bearer ${secret}`)).status).toBe(401);
  expect(load).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it('sends nothing when no inquiry is waiting', async () => {
  load.mockResolvedValue([]);
  const r = await call(`Bearer ${secret}`);
  expect(await r.json()).toEqual({ ok: true, pending: 0 });
  expect(r.headers.get('cache-control')).toBe('private, no-store');
  expect(send).not.toHaveBeenCalled();
});

it('sends one reminder for the waiting inquiries', async () => {
  load.mockResolvedValue([
    {
      id: 'aaaaaaaa-1111-4111-8111-111111111111',
      created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      name: 'Test',
      channel: 'whatsapp',
      source_path: '/ru/contact',
    },
  ]);
  send.mockResolvedValue(true);
  const r = await call(`Bearer ${secret}`);
  expect(await r.json()).toEqual({ ok: true, pending: 1 });
  expect(send).toHaveBeenCalledTimes(1);
  const [text, options] = send.mock.calls[0];
  expect(text).toContain('Без ответа 1 заявка (статус NEW).');
  expect(text).toContain('1. Test · whatsapp · /ru/contact · 3 дня');
  expect(options).toEqual({ context: { job: 'inquiry-reminder' } });
});

it('fails loudly when Telegram does not accept the reminder', async () => {
  load.mockResolvedValue([
    {
      id: 'aaaaaaaa-1111-4111-8111-111111111111',
      created_at: new Date().toISOString(),
      name: 'Test',
      channel: 'phone',
      source_path: null,
    },
  ]);
  send.mockResolvedValue(false);
  const r = await call(`Bearer ${secret}`);
  expect(r.status).toBe(503);
  expect(await r.json()).toEqual({ ok: false, pending: 1 });
});

it('reports a database failure without details', async () => {
  load.mockRejectedValue(new Error('service key leaked?'));
  const r = await call(`Bearer ${secret}`);
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('service');
  expect(send).not.toHaveBeenCalled();
});

it('is unavailable without database settings', async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  expect((await call(`Bearer ${secret}`)).status).toBe(503);
  expect(load).not.toHaveBeenCalled();
});

it('is scheduled daily at 04:00 UTC (09:00 Almaty) in vercel.json', () => {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')
  );
  expect(config.crons).toContainEqual({
    path: '/api/cron/inquiry-reminder',
    schedule: '0 4 * * *',
  });
});
