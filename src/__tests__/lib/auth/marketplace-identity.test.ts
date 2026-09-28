import { createServiceClient } from '@/lib/supabase/server';
import { provisionGoogleIdentity } from '@/lib/auth/marketplace-identity';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const rpc = jest.fn();
const serviceClient = createServiceClient as jest.Mock;
const input = {
  subject: 'google-subject-123',
  email: ' Person@Example.COM ',
  name: 'Test Person',
  image: 'https://lh3.googleusercontent.com/photo',
};
const identity = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  email: 'person@example.com',
  name: 'Test Person',
  image: 'https://lh3.googleusercontent.com/photo',
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ADMIN_EMAILS;
  serviceClient.mockResolvedValue({ rpc });
});

it('normalizes email and returns the stable identity from the RPC', async () => {
  rpc.mockResolvedValue({ data: identity, error: null });
  await expect(provisionGoogleIdentity(input)).resolves.toEqual(identity);
  expect(rpc).toHaveBeenCalledWith('provision_google_marketplace_identity', {
    p_subject: input.subject,
    p_email: identity.email,
    p_name: input.name,
    p_image: input.image,
  });
  await expect(provisionGoogleIdentity(input)).resolves.toEqual(identity);
  expect(rpc).toHaveBeenCalledTimes(2);
});

it('rejects reserved admin email before touching storage', async () => {
  process.env.ADMIN_EMAILS = 'person@example.com';
  await expect(provisionGoogleIdentity(input)).rejects.toThrow(
    'Unable to provision marketplace identity'
  );
  expect(createServiceClient).not.toHaveBeenCalled();
});

it('rejects malformed provider claims before touching storage', async () => {
  await expect(
    provisionGoogleIdentity({ ...input, subject: ' ' })
  ).rejects.toThrow('Unable to provision marketplace identity');
  await expect(
    provisionGoogleIdentity({ ...input, image: 'javascript:alert(1)' })
  ).rejects.toThrow('Unable to provision marketplace identity');
  expect(createServiceClient).not.toHaveBeenCalled();
});

it('does not reveal database conflict or malformed RPC details', async () => {
  rpc.mockResolvedValueOnce({
    data: null,
    error: { message: 'duplicate key person@example.com' },
  });
  await expect(provisionGoogleIdentity(input)).rejects.toThrow(
    'Unable to provision marketplace identity'
  );
  rpc.mockResolvedValueOnce({
    data: { ...identity, role: 'admin' },
    error: null,
  });
  await expect(provisionGoogleIdentity(input)).rejects.toThrow(
    'Unable to provision marketplace identity'
  );
});
