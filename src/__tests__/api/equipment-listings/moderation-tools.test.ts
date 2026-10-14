/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
jest.mock('@/lib/auth/admin', () => ({ requireModerator: jest.fn() }));
jest.mock('@/lib/equipment-listings/submission-hooks', () => ({
  afterSubmission: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/moderation-repository', () => ({
  TRUST_MARKS: ['PHONE_CONFIRMED', 'DOCUMENTS_REVIEWED', 'VERIFIED_QAZNEDR'],
  trustMarksFor: jest.fn(async () => ({})),
  prechecksFor: jest.fn(async () => ({})),
  setTrustMark: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/repository', () => ({
  listByStatus: jest.fn(async () => []),
  getModeratable: jest.fn(),
  getOwned: jest.fn(),
  saveTransition: jest.fn(),
  RepositoryError: class extends Error {},
}));
import { getServerSession } from 'next-auth';
import { requireModerator } from '@/lib/auth/admin';
import * as repo from '@/lib/equipment-listings/repository';
import * as moderation from '@/lib/equipment-listings/moderation-repository';
import { afterSubmission } from '@/lib/equipment-listings/submission-hooks';
import { GET as queue } from '@/app/api/admin/equipment-listings/route';
import { POST as trust } from '@/app/api/admin/equipment-listings/[id]/trust/route';
import { POST as submit } from '@/app/api/equipment-listings/[id]/submit/route';

const id = '00000000-0000-4000-8000-000000000009';
const context = { params: Promise.resolve({ id }) };
const data = {
  schemaVersion: 2,
  offerType: 'SERVICE',
  category: 'labService',
  serviceMethods: ['FIRE_ASSAY'],
  title: 'Lab',
  region: 'abai',
  city: 'Semey',
  availability: 'Now',
  contactName: 'Owner',
  phone: '+77001234567',
  contactVisibility: 'PRIVATE',
};
const req = (url: string, method = 'GET', body?: unknown) =>
  new Request(url, {
    method,
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  process.env.NEXTAUTH_URL = 'https://qaznedr.kz';
  (requireModerator as jest.Mock).mockResolvedValue({
    userId: 'mod',
    role: 'moderator',
  });
});
afterAll(() => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
});

it('lists published listings for moderators with trust marks and pre-checks', async () => {
  const res = await queue(
    req('https://qaznedr.kz/api/admin/equipment-listings?status=ACTIVE')
  );
  expect(res.status).toBe(200);
  expect(repo.listByStatus).toHaveBeenCalledWith('ACTIVE');
  expect(await res.json()).toMatchObject({ trustMarks: {}, prechecks: {} });
  await queue(
    req('https://qaznedr.kz/api/admin/equipment-listings?status=DRAFT')
  );
  expect(repo.listByStatus).toHaveBeenLastCalledWith('PENDING_MODERATION');
});

it('sets a trust mark only as a moderator and only on a reviewable listing', async () => {
  const url = `https://qaznedr.kz/api/admin/equipment-listings/${id}/trust`;
  (repo.getModeratable as jest.Mock).mockResolvedValue({
    id,
    status: 'ACTIVE',
  });
  const ok = await trust(
    req(url, 'POST', { mark: 'PHONE_CONFIRMED', enabled: true }),
    context
  );
  expect(ok.status).toBe(200);
  expect(moderation.setTrustMark).toHaveBeenCalledWith(
    id,
    'PHONE_CONFIRMED',
    true,
    'mod',
    undefined
  );

  expect(
    (
      await trust(
        req(url, 'POST', { mark: 'ALL_GOOD', enabled: true }),
        context
      )
    ).status
  ).toBe(400);
  (repo.getModeratable as jest.Mock).mockResolvedValue(null);
  expect(
    (
      await trust(
        req(url, 'POST', { mark: 'PHONE_CONFIRMED', enabled: true }),
        context
      )
    ).status
  ).toBe(404);
  (requireModerator as jest.Mock).mockResolvedValue(null);
  expect(
    (
      await trust(
        req(url, 'POST', { mark: 'PHONE_CONFIRMED', enabled: true }),
        context
      )
    ).status
  ).toBe(403);
});

it('runs the submission hook once a listing enters moderation', async () => {
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'owner' } });
  const draft = { id, ownerId: 'owner', status: 'DRAFT', revision: 1, data };
  (repo.getOwned as jest.Mock).mockResolvedValue(draft);
  (repo.saveTransition as jest.Mock).mockImplementation(
    async (_p, next) => next
  );
  const res = await submit(
    req(`https://qaznedr.kz/api/equipment-listings/${id}/submit`, 'POST', {
      expectedRevision: 1,
    }),
    context
  );
  expect(res.status).toBe(200);
  expect(afterSubmission).toHaveBeenCalledWith(
    expect.objectContaining({ id, status: 'PENDING_MODERATION', revision: 2 })
  );
});
