/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn(),
}));
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { loadHomeSnapshot } from '@/lib/leads/home';
const read = listPublishedLeads as jest.Mock;
let epoch = 100000;
beforeEach(() => {
  read.mockReset();
  epoch += 1000000;
  jest.spyOn(Date, 'now').mockReturnValue(epoch);
});
afterEach(() => jest.restoreAllMocks());
it('counts all pages and exposes only two featured teasers', async () => {
  const first = Array.from({ length: 50 }, (_, i) => ({
    code: `AU-${i}`,
    region: 'Костанайская',
  }));
  read
    .mockResolvedValueOnce({ leads: first, total: 51 })
    .mockResolvedValueOnce({
      leads: [{ code: 'CU-51', region: 'ВКО' }],
      total: 51,
    });
  const result = await loadHomeSnapshot();
  expect(result.stats).toEqual({ total: 51, regions: 2 });
  expect(result.leads).toEqual(first.slice(0, 2));
  expect(read).toHaveBeenNthCalledWith(2, { page: 2, limit: 50 });
});
it('keeps a real zero distinct from unavailable statistics', async () => {
  read.mockResolvedValue({ leads: [], total: 0 });
  expect(await loadHomeSnapshot()).toEqual({
    stats: { total: 0, regions: 0 },
    leads: [],
  });
});
it('hides partial data and invented fallback counts when any page fails', async () => {
  read
    .mockResolvedValueOnce({
      leads: [{ code: 'AU-1', region: 'ВКО' }],
      total: 51,
    })
    .mockRejectedValueOnce(new Error('offline'));
  expect(await loadHomeSnapshot()).toEqual({ stats: null, leads: [] });
});

it('reuses only a complete successful snapshot for one minute', async () => {
  read.mockResolvedValue({ leads: [], total: 0 });
  await loadHomeSnapshot();
  await loadHomeSnapshot();
  expect(read).toHaveBeenCalledTimes(1);
  jest.spyOn(Date, 'now').mockReturnValue(epoch + 60001);
  await loadHomeSnapshot();
  expect(read).toHaveBeenCalledTimes(2);
});
it('retries immediately after unavailable data instead of caching failure', async () => {
  read
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ leads: [], total: 0 });
  expect((await loadHomeSnapshot()).stats).toBeNull();
  expect((await loadHomeSnapshot()).stats).toEqual({ total: 0, regions: 0 });
});
