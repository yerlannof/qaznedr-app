/** @jest-environment node */
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
import { getServerSession } from 'next-auth';
import { createServiceClient } from '@/lib/supabase/server';
import {
  getCurrentAdmin,
  requireAdmin,
  requireModerator,
} from '@/lib/auth/admin';
beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_EMAILS = 'owner@example.invalid';
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { role: 'user' } }) }),
      }),
    }),
  });
});
afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});
it('requires both the env admin identity and email for bootstrap privilege', async () => {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { id: 'ordinary-provider-id', email: 'owner@example.invalid' },
  });
  expect(await requireAdmin()).toBeNull();
  (getServerSession as jest.Mock).mockResolvedValue({
    user: {
      id: 'env-admin:owner@example.invalid',
      email: 'owner@example.invalid',
    },
  });
  expect(await getCurrentAdmin()).toMatchObject({ role: 'super_admin' });
});
it('does not accept an env id for another email', async () => {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: {
      id: 'env-admin:other@example.invalid',
      email: 'owner@example.invalid',
    },
  });
  expect(await requireAdmin()).toBeNull();
});
it('keeps explicitly stored moderator roles valid', async () => {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { id: 'moderator-id', email: 'moderator@example.invalid' },
  });
  (createServiceClient as jest.Mock).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }),
      }),
    }),
  });
  expect(await requireAdmin()).toMatchObject({
    role: 'admin',
    userId: 'moderator-id',
  });
});
describe('marketplace moderator role', () => {
  function storedRole(role: string) {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'google-user', email: 'partner@example.invalid' },
    });
    (createServiceClient as jest.Mock).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { role } }) }),
        }),
      }),
    });
  }
  it('lets a moderator review listings without admin powers', async () => {
    storedRole('moderator');
    expect(await requireModerator()).toMatchObject({ role: 'moderator' });
    expect(await requireAdmin()).toBeNull();
  });
  it('lets admins moderate and refuses ordinary users', async () => {
    storedRole('admin');
    expect(await requireModerator()).toMatchObject({ role: 'admin' });
    storedRole('user');
    expect(await requireModerator()).toBeNull();
  });
});
