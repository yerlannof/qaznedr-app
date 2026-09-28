import { createServiceClient } from '@/lib/supabase/server';
import {
  equipmentRepository,
  RepositoryError,
} from '@/lib/equipment-listings/repository';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const listing = {
  id: '4e736637-25ce-444d-b4f7-c87bde3fd285',
  owner_id: 'owner-1',
  status: 'DRAFT',
  revision: 1,
  data: { title: 'Drill' },
  moderation_notes: null,
};
const submitted = {
  offerType: 'RENT' as const,
  category: 'drill' as const,
  title: 'Drill',
  city: 'Almaty',
  region: 'Almaty',
  currency: 'KZT' as const,
  priceUnit: 'DAY' as const,
  availability: 'Now',
  contactName: 'Owner',
  phone: '+77001234567',
  contactVisibility: 'PRIVATE' as const,
};

function query(result: { data: unknown; error: unknown }) {
  const q: Record<string, jest.Mock> = {};
  for (const method of ['select', 'insert', 'eq', 'order', 'limit'])
    q[method] = jest.fn().mockReturnValue(q);
  q.maybeSingle = jest.fn().mockResolvedValue(result);
  q.single = jest.fn().mockResolvedValue(result);
  q.then = jest.fn((resolve) => Promise.resolve(result).then(resolve));
  return q;
}

beforeEach(() => jest.clearAllMocks());

it('creates a draft with trusted owner and parsed fields', async () => {
  const q = query({ data: listing, error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({ from: () => q });
  const saved = await equipmentRepository.createDraft('owner-1', {
    title: ' Drill ',
  });
  expect(q.insert).toHaveBeenCalledWith({
    owner_id: 'owner-1',
    data: { title: 'Drill' },
  });
  expect(saved.data.title).toBe('Drill');
});

it('filters owner reads and caps result size', async () => {
  const q = query({ data: [listing], error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({ from: () => q });
  await equipmentRepository.listOwned('owner-1');
  expect(q.eq).toHaveBeenCalledWith('owner_id', 'owner-1');
  expect(q.limit).toHaveBeenCalledWith(100);
});

it('uses atomic RPC with previous revision and rejects stale writes', async () => {
  const rpc = jest
    .fn()
    .mockResolvedValue({ data: null, error: { code: '40001' } });
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
  await expect(
    equipmentRepository.saveTransition(
      {
        id: listing.id,
        ownerId: 'owner-1',
        status: 'DRAFT',
        revision: 1,
        data: { title: 'Drill' },
      },
      {
        id: listing.id,
        ownerId: 'owner-1',
        status: 'PENDING_MODERATION',
        revision: 2,
        data: submitted,
      },
      'owner-1'
    )
  ).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(rpc).toHaveBeenCalledWith(
    'transition_equipment_listing',
    expect.objectContaining({
      p_id: listing.id,
      p_expected_revision: 1,
      p_expected_owner_id: 'owner-1',
      p_expected_status: 'DRAFT',
      p_next_revision: 2,
      p_actor_id: 'owner-1',
    })
  );
});

it('returns null for an owner-scoped miss and hides database errors', async () => {
  const q = query({ data: null, error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({ from: () => q });
  expect(await equipmentRepository.getOwned(listing.id, 'other')).toBeNull();
  expect(q.eq).toHaveBeenCalledWith('owner_id', 'other');
  q.maybeSingle.mockResolvedValue({
    data: null,
    error: { message: 'secret SQL' },
  });
  await expect(
    equipmentRepository.getOwned(listing.id, 'other')
  ).rejects.toEqual(new RepositoryError('UNAVAILABLE'));
});

it('archives an incomplete draft and hydrates the saved row', async () => {
  const archived = { ...listing, status: 'ARCHIVED', revision: 2 };
  const rpc = jest.fn().mockResolvedValue({ data: archived, error: null });
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
  const result = await equipmentRepository.saveTransition(
    {
      id: listing.id,
      ownerId: 'owner-1',
      status: 'DRAFT',
      revision: 1,
      data: { title: 'Drill' },
    },
    {
      id: listing.id,
      ownerId: 'owner-1',
      status: 'ARCHIVED',
      revision: 2,
      data: { title: 'Drill' },
    },
    'owner-1'
  );
  expect(result).toMatchObject({
    status: 'ARCHIVED',
    data: { title: 'Drill' },
  });
  expect(rpc).toHaveBeenCalledTimes(1);
});

it('lists an archived incomplete draft for its owner', async () => {
  const q = query({
    data: [{ ...listing, status: 'ARCHIVED', revision: 2 }],
    error: null,
  });
  (createServiceClient as jest.Mock).mockResolvedValue({ from: () => q });
  await expect(equipmentRepository.listOwned('owner-1')).resolves.toMatchObject(
    [{ status: 'ARCHIVED', data: { title: 'Drill' } }]
  );
});
