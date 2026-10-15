/**
 * @jest-environment node
 */
import { createServiceClient } from '@/lib/supabase/server';
import {
  BOT_AGENT,
  recordListingEvent,
  responseSchema,
  statsFor,
  submitResponse,
} from '@/lib/equipment-listings/engagement';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
const rpc = jest.fn();
const query = {
  select: jest.fn(() => query),
  in: jest.fn(() => query),
  gte: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXTAUTH_SECRET = 's';
  (createServiceClient as jest.Mock).mockResolvedValue({
    rpc,
    from: jest.fn(() => query),
  });
});
const id = '00000000-0000-4000-8000-000000000001';

it('records events only for valid ids', async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  await recordListingEvent(id, 'view');
  expect(rpc).toHaveBeenCalledWith('record_equipment_listing_event', {
    p_listing_id: id,
    p_kind: 'view',
  });
  await recordListingEvent('nope', 'view');
  expect(rpc).toHaveBeenCalledTimes(1);
});

it('sums 30 days of stats per listing', async () => {
  query.gte.mockResolvedValue({
    data: [
      { listing_id: id, views: 3, contact_clicks: 1 },
      { listing_id: id, views: 2, contact_clicks: 0 },
    ],
    error: null,
  });
  await expect(statsFor([id])).resolves.toEqual({
    [id]: { views: 5, contacts: 1 },
  });
  await expect(statsFor([])).resolves.toEqual({});
});

it('normalizes the responder phone and hashes the IP', async () => {
  const parsed = responseSchema.parse({
    name: ' Бур-Сервис ',
    phone: '8 701 123 45 67',
    message: 'Есть станок',
  });
  expect(parsed).toEqual({
    name: 'Бур-Сервис',
    phone: '+77011234567',
    message: 'Есть станок',
  });
  expect(responseSchema.safeParse({ ...parsed, phone: '123' }).success).toBe(
    false
  );
  rpc.mockResolvedValue({ data: 'saved', error: null });
  await expect(submitResponse(id, parsed, '1.2.3.4')).resolves.toBe('saved');
  expect(rpc.mock.calls[0][1].p_ip_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(rpc.mock.calls[0][1].p_ip_hash).not.toContain('1.2.3.4');
});

it('recognizes crawlers', () => {
  expect(BOT_AGENT.test('Googlebot/2.1')).toBe(true);
  expect(BOT_AGENT.test('facebookexternalhit/1.1')).toBe(true);
  expect(
    BOT_AGENT.test('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1')
  ).toBe(false);
});
