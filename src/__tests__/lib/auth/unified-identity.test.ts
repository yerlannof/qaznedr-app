/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/jwt-security', () => ({
  getSecureAuthConfig: () => ({ session: { strategy: 'jwt' } }),
}));
jest.mock('@/lib/auth/env-admin', () => ({
  verifyEnvAdmin: jest.fn(),
  isEnvAdminEmail: jest.fn(
    (email: string) => email?.trim().toLowerCase() === 'owner@example.invalid'
  ),
}));
jest.mock('@/lib/auth/marketplace-identity', () => ({
  provisionGoogleIdentity: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createServiceClient: jest.fn(),
}));
import { authOptions } from '@/lib/services/auth.config';
import { authOptions as compatibilityOptions } from '@/lib/auth';
import { verifyEnvAdmin } from '@/lib/auth/env-admin';
import { provisionGoogleIdentity } from '@/lib/auth/marketplace-identity';
import { createClient, createServiceClient } from '@/lib/supabase/server';
const normalized = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'member@example.invalid',
  name: 'Member',
  image: null,
};
function signIn(overrides: Record<string, unknown> = {}) {
  return authOptions.callbacks.signIn({
    user: {
      id: 'google-sub',
      email: 'member@example.invalid',
      name: 'Member',
      image: null,
    },
    account: { provider: 'google', providerAccountId: 'google-sub' },
    profile: {
      sub: 'google-sub',
      email: 'member@example.invalid',
      email_verified: true,
    },
    ...overrides,
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  process.env.MARKETPLACE_IDENTITY_ENABLED = 'true';
  (provisionGoogleIdentity as jest.Mock).mockResolvedValue(normalized);
  (verifyEnvAdmin as jest.Mock).mockResolvedValue(null);
});
afterEach(() => {
  delete process.env.MARKETPLACE_IDENTITY_ENABLED;
});
it('uses the same auth config on legacy imports', () => {
  expect(compatibilityOptions).toBe(authOptions);
});
it('blocks Google provisioning when pilot is disabled', async () => {
  delete process.env.MARKETPLACE_IDENTITY_ENABLED;
  expect(await signIn()).toBe(false);
  expect(provisionGoogleIdentity).not.toHaveBeenCalled();
});
it.each([
  { email_verified: false },
  { email_verified: 'true' },
  { email_verified: undefined },
  { sub: 'other-sub' },
  { email: 'different@example.invalid' },
])('rejects unverified or inconsistent Google claims %j', async (patch) => {
  expect(
    await signIn({
      profile: {
        sub: 'google-sub',
        email: 'member@example.invalid',
        email_verified: true,
        ...patch,
      },
    })
  ).toBe(false);
  expect(provisionGoogleIdentity).not.toHaveBeenCalled();
});
it('requires provider subject and verified profile, never email alone', async () => {
  expect(await signIn({ account: { provider: 'google' } })).toBe(false);
  expect(await signIn({ profile: undefined })).toBe(false);
  expect(provisionGoogleIdentity).not.toHaveBeenCalled();
});
it('provisions then carries the canonical id into jwt and session', async () => {
  const user = {
    id: 'google-sub',
    email: 'member@example.invalid',
    name: 'Member',
    image: null,
  };
  expect(await signIn({ user })).toBe(true);
  expect(user.id).toBe(normalized.id);
  expect(provisionGoogleIdentity).toHaveBeenCalledWith({
    subject: 'google-sub',
    email: 'member@example.invalid',
    name: 'Member',
    image: null,
  });
  const token = await authOptions.callbacks.jwt({ token: {}, user });
  const session = await authOptions.callbacks.session({
    session: { user: {} },
    token,
  });
  expect(session.user.id).toBe(normalized.id);
  expect(session.user.email).toBe(normalized.email);
});
it('fails closed on storage errors and rejects unsupported providers', async () => {
  (provisionGoogleIdentity as jest.Mock).mockRejectedValue(
    new Error('private database data')
  );
  expect(await signIn()).toBe(false);
  expect(await signIn({ account: { provider: 'unknown' } })).toBe(false);
});
it('does not reserve owner privilege by Google email', async () => {
  expect(
    await signIn({
      user: { id: 'sub', email: 'owner@example.invalid' },
      account: { provider: 'google', providerAccountId: 'sub' },
      profile: {
        sub: 'sub',
        email: 'owner@example.invalid',
        email_verified: true,
      },
    })
  ).toBe(false);
  expect(provisionGoogleIdentity).not.toHaveBeenCalled();
});
it('keeps env-admin authorization and never reads passwords through anon DB', async () => {
  const provider = authOptions.providers.find(
    (p: any) => p.id === 'credentials'
  ) as any;
  const authorize = provider.options?.authorize ?? provider.authorize;
  const owner = {
    id: 'env-admin:owner@example.invalid',
    email: 'owner@example.invalid',
    name: 'Admin',
    image: null,
  };
  (verifyEnvAdmin as jest.Mock).mockResolvedValue(owner);
  expect(
    await authorize(
      { email: 'owner@example.invalid', password: 'synthetic' },
      { headers: { 'x-forwarded-for': '127.0.0.1' } }
    )
  ).toEqual(owner);
  (verifyEnvAdmin as jest.Mock).mockResolvedValue(null);
  expect(
    await authorize(
      { email: 'member@example.invalid', password: 'synthetic' },
      { headers: {} }
    )
  ).toBeNull();
  expect(createClient).not.toHaveBeenCalled();
  expect(createServiceClient).not.toHaveBeenCalled();
});
