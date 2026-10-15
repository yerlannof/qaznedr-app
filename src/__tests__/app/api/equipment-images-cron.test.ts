/**
 * @jest-environment node
 */
import { GET } from '@/app/api/cron/equipment-images/route';
import { processImageDeletionBatch } from '@/lib/equipment-listings/image-cleanup';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({})),
}));
jest.mock('@/lib/equipment-listings/image-cleanup', () => ({
  createTimedCleanupFetch: jest.fn(),
  processImageDeletionBatch: jest.fn(),
}));

const secret = 's'.repeat(40);
const call = (auth?: string) =>
  GET(
    new Request('https://qaznedr.kz/api/cron/equipment-images', {
      headers: auth ? { authorization: auth } : {},
    })
  );
const batch = processImageDeletionBatch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = secret;
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
});

it('refuses calls without the cron secret', async () => {
  expect((await call()).status).toBe(401);
  expect((await call('Bearer wrong')).status).toBe(401);
  delete process.env.CRON_SECRET;
  expect((await call(`Bearer ${secret}`)).status).toBe(401);
  expect(batch).not.toHaveBeenCalled();
});

it('does nothing while the marketplace is off', async () => {
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'false';
  const r = await call(`Bearer ${secret}`);
  expect(await r.json()).toEqual({ ok: true, skipped: true });
  expect(batch).not.toHaveBeenCalled();
});

it('runs one bounded batch', async () => {
  batch.mockResolvedValue({ claimed: 2, completed: 2, failed: 0 });
  const r = await call(`Bearer ${secret}`);
  expect(await r.json()).toEqual({
    ok: true,
    claimed: 2,
    completed: 2,
    failed: 0,
  });
  expect(batch).toHaveBeenCalledWith({}, 10);
});

it('reports failure without details', async () => {
  batch.mockRejectedValue(new Error('storage secret'));
  const r = await call(`Bearer ${secret}`);
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('secret');
});
