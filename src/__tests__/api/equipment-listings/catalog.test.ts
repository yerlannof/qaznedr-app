/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/equipment-catalog/route';
import { searchEquipmentCatalog } from '@/lib/equipment-listings/catalog-repository';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  searchEquipmentCatalog: jest.fn(),
}));
jest.mock('@/lib/middleware/rate-limiting', () => ({
  withRateLimit: jest.fn((handler) => handler),
}));
const request = (query = '') =>
  new NextRequest('https://qaznedr.kz/api/equipment-catalog?' + query);
const oldMarketplace = process.env.EQUIPMENT_MARKETPLACE_ENABLED;
const oldCatalog = process.env.EQUIPMENT_CATALOG_ENABLED;
beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  delete process.env.EQUIPMENT_CATALOG_ENABLED;
});
afterAll(() => {
  if (oldMarketplace === undefined)
    delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  else process.env.EQUIPMENT_MARKETPLACE_ENABLED = oldMarketplace;
  if (oldCatalog === undefined) delete process.env.EQUIPMENT_CATALOG_ENABLED;
  else process.env.EQUIPMENT_CATALOG_ENABLED = oldCatalog;
});

it('requires both independent launch gates before any rate/storage call', async () => {
  for (const [market, catalog] of [
    [undefined, undefined],
    ['true', undefined],
    [undefined, 'true'],
  ]) {
    if (market) process.env.EQUIPMENT_MARKETPLACE_ENABLED = market;
    else delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
    if (catalog) process.env.EQUIPMENT_CATALOG_ENABLED = catalog;
    else delete process.env.EQUIPMENT_CATALOG_ENABLED;
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  }
  expect(searchEquipmentCatalog).not.toHaveBeenCalled();
  expect(withRateLimit).not.toHaveBeenCalled();
});

it('rejects invalid/oversized filters without querying storage', async () => {
  process.env.EQUIPMENT_MARKETPLACE_ENABLED =
    process.env.EQUIPMENT_CATALOG_ENABLED = 'true';
  for (const query of [
    'status=DRAFT',
    'method=CORE&method=RC',
    'q=' + 'x'.repeat(2000),
  ]) {
    expect((await GET(request(query))).status).toBe(400);
  }
  expect(searchEquipmentCatalog).not.toHaveBeenCalled();
});

it('returns a bounded public result and hides errors', async () => {
  process.env.EQUIPMENT_MARKETPLACE_ENABLED =
    process.env.EQUIPMENT_CATALOG_ENABLED = 'true';
  (searchEquipmentCatalog as jest.Mock).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const response = await GET(request('method=RC'));
  expect(response.status).toBe(200);
  expect(withRateLimit).toHaveBeenCalledWith(expect.any(Function), 'search');
  expect(await response.json()).toEqual({
    success: true,
    data: { items: [], total: 0, page: 1, limit: 20 },
  });
  (searchEquipmentCatalog as jest.Mock).mockRejectedValue(
    new Error('private database error')
  );
  const failed = await GET(request());
  expect(failed.status).toBe(503);
  expect(await failed.json()).toEqual({
    success: false,
    error: 'Equipment catalogue unavailable',
  });
});
