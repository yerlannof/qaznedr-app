import { createServiceClient } from '@/lib/supabase/server';
import { searchEquipmentCatalog } from '@/lib/equipment-listings/catalog-repository';
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
    region: 'Караганда',
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
