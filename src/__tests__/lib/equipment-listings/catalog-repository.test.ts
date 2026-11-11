import { createServiceClient } from '@/lib/supabase/server';
import {
  listActiveForSitemap,
  listingExists,
  searchEquipmentCatalog,
} from '@/lib/equipment-listings/catalog-repository';
import { parseEquipmentSearchQuery } from '@/lib/equipment-listings/search';
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
const filters = parseEquipmentSearchQuery(
  new URLSearchParams('method=CORE&depth=500&diameter=96')
);
const row = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-000000000001',
  owner_id: 'hidden-owner',
  status: 'ACTIVE',
  revision: 1,
  moderation_notes: 'Hidden moderation',
  updated_at: '2026-10-03T00:00:00+00:00',
  data: {
    schemaVersion: 2,
    category: 'drill',
    offerType: 'RENT',
    title: 'Drill',
    region: 'karagandy',
    city: 'Караганда',
    availability: 'Now',
    contactName: 'Hidden Name',
    phone: '+77001112233',
    contactVisibility: 'PRIVATE',
    capabilities: [{ method: 'CORE', depth: 1000, diameter: 96 }],
  },
};
beforeEach(() => jest.clearAllMocks());

it('projects service-only RPC rows to a public allowlist and preserves totals', async () => {
  const rpc = jest
    .fn()
    .mockResolvedValue({ data: { rows: [row], total: 1 }, error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
  const result = await searchEquipmentCatalog(filters);
  expect(rpc).toHaveBeenCalledWith(
    'search_equipment_catalog',
    expect.objectContaining({ p_method: 'CORE', p_depth: 500, p_diameter: 96 })
  );
  expect(result).toMatchObject({
    total: 1,
    page: 1,
    limit: 20,
    items: [{ id: row.id, title: 'Drill' }],
  });
  const json = JSON.stringify(result);
  for (const secret of [
    'hidden-owner',
    'Hidden moderation',
    '+77001112233',
    'Hidden Name',
    'owner_id',
    'contactVisibility',
  ])
    expect(json).not.toContain(secret);
});

it('never turns a broken database or invalid record into an empty/partial catalogue', async () => {
  const rpc = jest.fn();
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
  for (const wire of [
    { data: null, error: { message: 'secret database config' } },
    { data: { rows: [{ ...row, status: 'DRAFT' }], total: 1 }, error: null },
    {
      data: {
        rows: [
          row,
          {
            ...row,
            data: { ...row.data, capabilities: [{ method: 'INVALID' }] },
          },
        ],
        total: 2,
      },
      error: null,
    },
    { data: { rows: [row], total: 0 }, error: null },
  ]) {
    rpc.mockResolvedValue(wire);
    await expect(searchEquipmentCatalog(filters)).rejects.toThrow(
      'Equipment catalogue unavailable'
    );
  }
});

it('accepts deliberate public contacts and an empty page with a nonzero total', async () => {
  const rpc = jest.fn().mockResolvedValue({
    data: {
      rows: [{ ...row, data: { ...row.data, contactVisibility: 'PUBLIC' } }],
      total: 1,
    },
    error: null,
  });
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
  expect((await searchEquipmentCatalog(filters)).items[0]).toHaveProperty(
    'phone',
    row.data.phone
  );
  rpc.mockResolvedValue({ data: { rows: [], total: 100 }, error: null });
  expect(
    await searchEquipmentCatalog(
      parseEquipmentSearchQuery(new URLSearchParams('page=20'))
    )
  ).toMatchObject({ items: [], total: 100, page: 20 });
});

it('reads each published listing with its original language for the sitemap', async () => {
  const limit = jest.fn().mockResolvedValue({
    data: [
      { id: row.id, updated_at: row.updated_at, source_language: null },
      {
        id: 'aaaaaaaa-aaaa-4aaa-aaaa-000000000002',
        updated_at: row.updated_at,
        source_language: 'en',
      },
    ],
    error: null,
  });
  const select = jest.fn(() => ({
    eq: () => ({ order: () => ({ limit }) }),
  }));
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: () => ({ select }),
  });
  expect(await listActiveForSitemap()).toEqual([
    { id: row.id, updatedAt: row.updated_at },
    {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-000000000002',
      updatedAt: row.updated_at,
      sourceLanguage: 'en',
    },
  ]);
  // Only the id, date and language leave the table, never the whole record.
  expect(select).toHaveBeenCalledWith(
    'id,updated_at,source_language:data->>sourceLanguage'
  );
  limit.mockResolvedValue({ data: null, error: { message: 'down' } });
  await expect(listActiveForSitemap()).rejects.toThrow(
    'Equipment catalogue unavailable'
  );
});

it('tells whether a listing ever existed without reading its record', async () => {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: { id: row.id },
    error: null,
  });
  const select = jest.fn(() => ({ eq: () => ({ maybeSingle }) }));
  const from = jest.fn(() => ({ select }));
  (createServiceClient as jest.Mock).mockResolvedValue({ from });
  expect(await listingExists(row.id)).toBe(true);
  expect(select).toHaveBeenCalledWith('id');
  maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await listingExists(row.id)).toBe(false);
  maybeSingle.mockResolvedValue({ data: null, error: { message: 'down' } });
  await expect(listingExists(row.id)).rejects.toThrow(
    'Equipment catalogue unavailable'
  );
  from.mockClear();
  expect(await listingExists('not-a-uuid')).toBe(false);
  expect(from).not.toHaveBeenCalled();
});
