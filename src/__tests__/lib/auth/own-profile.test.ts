import { createServiceClient } from '@/lib/supabase/server';
import {
  getOwnProfile,
  updateOwnProfile,
  profilePatchSchema,
  profileSetupSchema,
  ProfileStorageError,
} from '@/lib/auth/own-profile';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const userId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const profile = {
  id: userId,
  full_name: 'Ada',
  email: 'ada@example.com',
  profile_type: 'investor',
  country: null,
  company_name: null,
  phone: null,
  description: null,
  city: null,
  website: null,
  service_types: null,
};
const columns =
  'id,full_name,email,profile_type,country,company_name,phone,description,city,website,service_types';

function clientResult(data: unknown, error: unknown = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ maybeSingle }),
    maybeSingle,
  });
  const select = jest.fn().mockReturnValue({ eq });
  const update = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select, update });
  (createServiceClient as jest.Mock).mockResolvedValue({ from });
  return { from, select, update, eq, maybeSingle };
}

beforeEach(() => jest.resetAllMocks());

it('accepts only a closed, nonempty patch and setup shape', () => {
  expect(profileSetupSchema.parse({ profile_type: 'investor' })).toEqual({
    profile_type: 'investor',
  });
  expect(() =>
    profileSetupSchema.parse({ profile_type: 'investor', role: 'admin' })
  ).toThrow();
  expect(() => profilePatchSchema.parse({})).toThrow();
  for (const field of [
    'id',
    'email',
    'role',
    'avatar_url',
    'is_verified',
    'verification_document_url',
    'is_trusted_seller',
    'contacts_viewed_count',
    'public',
  ]) {
    expect(() => profilePatchSchema.parse({ [field]: 'unsafe' })).toThrow();
  }
});

it('normalizes nullable fields and enforces limits', () => {
  expect(
    profilePatchSchema.parse({
      full_name: '  Ada  ',
      company_name: '  ',
      city: '',
      country: ' KZ ',
      description: ' ',
      phone: ' +77001234567 ',
      website: ' https://example.com/path ',
      service_types: [' Drilling ', 'Consulting'],
    })
  ).toEqual({
    full_name: 'Ada',
    company_name: null,
    city: null,
    country: 'KZ',
    description: null,
    phone: '+77001234567',
    website: 'https://example.com/path',
    service_types: ['Drilling', 'Consulting'],
  });
  for (const patch of [
    { full_name: ' ' },
    { full_name: 'a'.repeat(201) },
    { company_name: 'a'.repeat(201) },
    { city: 'a'.repeat(121) },
    { country: 'a'.repeat(121) },
    { description: 'a'.repeat(3001) },
    { phone: '+123456' },
    { phone: '77001234567' },
    { website: 'http://example.com' },
    { website: 'https://user:pass@example.com' },
    { website: `https://example.com/${'a'.repeat(2048)}` },
    { service_types: [''] },
    { service_types: ['a'.repeat(81)] },
    { service_types: Array.from({ length: 21 }, (_, i) => String(i)) },
    { service_types: ['Drilling', ' Drilling '] },
    { profile_type: 'admin' },
  ])
    expect(() => profilePatchSchema.parse(patch)).toThrow();
});

it('validates owner and patch before opening the service client', async () => {
  await expect(getOwnProfile('not-uuid')).rejects.toThrow();
  await expect(
    updateOwnProfile('not-uuid', { full_name: 'Ada' })
  ).rejects.toThrow();
  await expect(updateOwnProfile(userId, { role: 'admin' })).rejects.toThrow();
  await expect(updateOwnProfile(userId, {})).rejects.toThrow();
  expect(createServiceClient).not.toHaveBeenCalled();
});

it('reads the exact owner row and projects away unexpected fields', async () => {
  const q = clientResult({
    ...profile,
    role: 'admin',
    verification_document_url: 'secret',
  });
  await expect(getOwnProfile(userId)).resolves.toEqual(profile);
  expect(q.from).toHaveBeenCalledWith('profiles');
  expect(q.select).toHaveBeenCalledWith(columns);
  expect(q.eq).toHaveBeenCalledWith('id', userId);
  expect(q.maybeSingle).toHaveBeenCalledTimes(1);
});

it('updates only the owner with parsed values and server timestamp, without creating rows', async () => {
  const q = clientResult({ ...profile, role: 'admin' });
  await expect(
    updateOwnProfile(userId, { full_name: ' Ada ', phone: '' })
  ).resolves.toEqual(profile);
  expect(q.from).toHaveBeenCalledWith('profiles');
  expect(q.update).toHaveBeenCalledTimes(1);
  expect(q.update.mock.calls[0][0]).toEqual({
    full_name: 'Ada',
    phone: null,
    updated_at: expect.any(String),
  });
  expect(q.eq).toHaveBeenCalledWith('id', userId);
  expect(q.eq.mock.results[0].value.select).toHaveBeenCalledWith(columns);
  expect(q.maybeSingle).toHaveBeenCalledTimes(1);
});

it('distinguishes missing rows from storage failures, without exposing errors', async () => {
  clientResult(null);
  await expect(getOwnProfile(userId)).resolves.toBeNull();
  clientResult(null);
  await expect(
    updateOwnProfile(userId, { city: 'Almaty' })
  ).resolves.toBeNull();
  clientResult(null, { message: 'secret database details' });
  await expect(getOwnProfile(userId)).rejects.toThrow(ProfileStorageError);
  await expect(getOwnProfile(userId)).rejects.toThrow(
    'Unable to access profile'
  );
  clientResult(null, { message: 'secret database details' });
  await expect(updateOwnProfile(userId, { city: 'Almaty' })).rejects.toThrow(
    ProfileStorageError
  );
  (createServiceClient as jest.Mock).mockRejectedValue(
    new Error('secret credentials')
  );
  await expect(getOwnProfile(userId)).rejects.toThrow(
    'Unable to access profile'
  );
});
