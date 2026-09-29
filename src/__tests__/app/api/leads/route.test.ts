/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn(),
}));
jest.mock('@/lib/middleware/rate-limiting', () => ({
  withRateLimit: (handler: unknown) => handler,
}));
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { GET } from '@/app/api/leads/route';
const read = listPublishedLeads as jest.Mock;
const empty = { leads: [], total: 0, page: 1, limit: 24, totalPages: 0 };
const request = (region: string) =>
  new NextRequest(`https://qaznedr.kz/api/leads?region=${region}`);
beforeEach(() => {
  read.mockReset();
});
afterEach(() => {
  jest.restoreAllMocks();
});

it('returns a safe, noncacheable 503 and retries immediately after a database failure', async () => {
  read
    .mockRejectedValueOnce(new Error('private database detail'))
    .mockResolvedValueOnce(empty);
  const failed = await GET(request('recovery'));
  expect(failed.status).toBe(503);
  expect(failed.headers.get('cache-control')).toBe('no-store');
  expect(await failed.json()).toEqual({
    success: false,
    error: 'Unable to load areas',
  });
  const recovered = await GET(request('recovery'));
  expect(recovered.status).toBe(200);
  expect(await recovered.json()).toEqual({ success: true, data: empty });
  expect(read).toHaveBeenCalledTimes(2);
});

it('caches successful empty results but reads again after 60 seconds', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(100000);
  read.mockResolvedValue(empty);
  await GET(request('ttl'));
  now.mockReturnValue(159999);
  await GET(request('ttl'));
  expect(read).toHaveBeenCalledTimes(1);
  now.mockReturnValue(160001);
  await GET(request('ttl'));
  expect(read).toHaveBeenCalledTimes(2);
});

it('passes only recognized geological types through the public API', async () => {
  read.mockResolvedValue(empty);
  await GET(new NextRequest('https://qaznedr.kz/api/leads?type=bedrock'));
  expect(read).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'bedrock' })
  );
  await GET(new NextRequest('https://qaznedr.kz/api/leads?type=unrecognized'));
  expect(read).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: undefined })
  );
});

it('does not hand showcase circle centres to API clients as coordinates', async () => {
  read.mockResolvedValue({
    ...empty,
    total: 1,
    leads: [
      {
        code: 'QN-99',
        map_centroid: { lat: 49, lon: 72 },
        showcase: {
          card_id: 'QN-99',
          zone: { center_lat: 49, center_lon: 72, radius_km: 50 },
        },
      },
    ],
  });
  const res = await GET(request('zones'));
  const body = await res.json();
  expect(body.data.leads[0].map_centroid).toBeNull();
  expect(body.data.leads[0].showcase.zone).toBeUndefined();
  expect(JSON.stringify(body)).not.toMatch(/center_lat|center_lon/);
});
