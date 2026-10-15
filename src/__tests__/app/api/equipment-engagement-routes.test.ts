/**
 * @jest-environment node
 */
import { POST as event } from '@/app/api/equipment-catalog/[id]/event/route';
import { POST as respond } from '@/app/api/equipment-catalog/[id]/responses/route';
import {
  recordListingEvent,
  submitResponse,
} from '@/lib/equipment-listings/engagement';

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return { ...actual, after: (task: () => void) => task() };
});
jest.mock('@/lib/equipment-listings/engagement', () => {
  const actual = jest.requireActual('@/lib/equipment-listings/engagement');
  return {
    ...actual,
    recordListingEvent: jest.fn(),
    submitResponse: jest.fn(),
    ownerOfActiveListing: jest.fn(async () => null),
  };
});
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/inquiries/notify', () => ({ notifyTelegram: jest.fn() }));

const id = '00000000-0000-4000-8000-000000000001';
const ctx = { params: Promise.resolve({ id }) };
const req = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  new Request(`https://qaznedr.kz/api/equipment-catalog/${id}/${path}`, {
    method: 'POST',
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.NEXTAUTH_URL;
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  process.env.EQUIPMENT_CATALOG_ENABLED = 'true';
});

it('stays closed while the catalogue is off', async () => {
  process.env.EQUIPMENT_CATALOG_ENABLED = 'false';
  expect((await event(req('event', { kind: 'contact' }), ctx)).status).toBe(
    404
  );
  expect(
    (
      await respond(
        req('responses', { name: 'A', phone: '87011234567', message: 'm' }),
        ctx
      )
    ).status
  ).toBe(404);
});

it('counts contact taps but ignores bots and other kinds', async () => {
  expect((await event(req('event', { kind: 'contact' }), ctx)).status).toBe(
    200
  );
  expect(recordListingEvent).toHaveBeenCalledWith(id, 'contact');
  await event(
    req('event', { kind: 'contact' }, { 'user-agent': 'Googlebot' }),
    ctx
  );
  expect(recordListingEvent).toHaveBeenCalledTimes(1);
  expect((await event(req('event', { kind: 'view' }), ctx)).status).toBe(400);
  expect(
    (
      await event(
        req('event', { kind: 'contact' }, { origin: 'https://evil.example' }),
        ctx
      )
    ).status
  ).toBe(403);
});

it('saves a response and maps limits', async () => {
  const body = {
    name: 'Бур-Сервис',
    phone: '8 701 123 45 67',
    message: 'Есть УКБ-5',
  };
  (submitResponse as jest.Mock).mockResolvedValueOnce('saved');
  expect(
    (await respond(req('responses', body, { 'x-real-ip': '9.9.9.9' }), ctx))
      .status
  ).toBe(200);
  expect(submitResponse).toHaveBeenCalledWith(
    id,
    { ...body, phone: '+77011234567' },
    '9.9.9.9'
  );
  (submitResponse as jest.Mock).mockResolvedValueOnce('rate_limited');
  expect((await respond(req('responses', body), ctx)).status).toBe(429);
  (submitResponse as jest.Mock).mockResolvedValueOnce('not_found');
  expect((await respond(req('responses', body), ctx)).status).toBe(404);
  expect(
    (await respond(req('responses', { ...body, phone: 'x' }), ctx)).status
  ).toBe(400);
});
