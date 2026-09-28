/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
jest.mock('@/lib/auth/admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/equipment-listings/repository', () => ({
  createDraft: jest.fn(),
  listOwned: jest.fn(),
  getOwned: jest.fn(),
  listPending: jest.fn(),
  getForModeration: jest.fn(),
  saveTransition: jest.fn(),
  RepositoryError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
import { getServerSession } from 'next-auth';
import { requireAdmin } from '@/lib/auth/admin';
import * as repo from '@/lib/equipment-listings/repository';
import { GET, POST } from '@/app/api/equipment-listings/route';
import { GET as detail, PATCH } from '@/app/api/equipment-listings/[id]/route';
import { POST as submit } from '@/app/api/equipment-listings/[id]/submit/route';
import { POST as archive } from '@/app/api/equipment-listings/[id]/archive/route';
import { GET as queue } from '@/app/api/admin/equipment-listings/route';
import { POST as moderate } from '@/app/api/admin/equipment-listings/[id]/moderate/route';
import { POST as register } from '@/app/api/auth/register/route';
const id = '00000000-0000-4000-8000-000000000001';
const context = { params: Promise.resolve({ id }) };
const fixture = {
  id,
  ownerId: 'owner',
  status: 'DRAFT',
  revision: 1,
  data: {
    offerType: 'RENT',
    category: 'drill',
    title: 'Synthetic drill',
    region: 'Test',
    city: 'Test',
    currency: 'KZT',
    priceUnit: 'DAY',
    availability: 'Test',
    contactName: 'Test',
    phone: '+70000000000',
    contactVisibility: 'PRIVATE',
  },
};
function req(
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return new Request('https://qaznedr.kz/api/equipment-listings', {
    method,
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'owner' } });
  (requireAdmin as jest.Mock).mockResolvedValue(null);
  (repo.getOwned as jest.Mock).mockResolvedValue(structuredClone(fixture));
  (repo.getForModeration as jest.Mock).mockResolvedValue({
    ...structuredClone(fixture),
    status: 'PENDING_MODERATION',
  });
  (repo.saveTransition as jest.Mock).mockImplementation(
    async (_old, next) => next
  );
  (repo.listOwned as jest.Mock).mockResolvedValue([]);
  (repo.listPending as jest.Mock).mockResolvedValue([]);
});
afterEach(() => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
});
it('keeps every new route closed before session or storage access', async () => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  for (const call of [
    () => GET(req()),
    () => POST(req('POST', {})),
    () => detail(req(), context),
    () => PATCH(req('PATCH', {}), context),
    () => submit(req('POST', {}), context),
    () => archive(req('POST', {}), context),
    () => queue(req()),
    () => moderate(req('POST', {}), context),
  ]) {
    expect((await call()).status).toBe(404);
  }
  expect(getServerSession).not.toHaveBeenCalled();
  expect(repo.createDraft).not.toHaveBeenCalled();
});
it('closes legacy registration even when equipment pilot is enabled', async () => {
  expect(
    (await register(req('POST', { email: 'test@example.invalid' }))).status
  ).toBe(404);
});
it('requires authenticated owner and prevents shared caching', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const r = await GET(req());
  expect(r.status).toBe(401);
  expect(r.headers.get('cache-control')).toContain('no-store');
  expect(repo.listOwned).not.toHaveBeenCalled();
});
it('uses owner identity only from session', async () => {
  await GET(req());
  expect(repo.listOwned).toHaveBeenCalledWith('owner');
  expect(
    (await POST(req('POST', { ownerId: 'attacker', status: 'ACTIVE' }))).status
  ).toBe(400);
  expect(repo.createDraft).not.toHaveBeenCalled();
});
it('rejects cross-origin and missing-origin mutations before database access', async () => {
  for (const origin of ['https://evil.example', 'null', ''])
    expect((await POST(req('POST', {}, { origin }))).status).toBe(403);
  expect(repo.createDraft).not.toHaveBeenCalled();
});
it('requires JSON and bounds body bytes, including a lying content-length', async () => {
  expect(
    (await POST(req('POST', {}, { 'content-type': 'text/plain' }))).status
  ).toBe(415);
  expect(
    (
      await POST(
        req(
          'POST',
          { description: 'a'.repeat(40000) },
          { 'content-length': '1' }
        )
      )
    ).status
  ).toBe(413);
});
it('does not expose another owner item or mutate it', async () => {
  (repo.getOwned as jest.Mock).mockResolvedValue(null);
  expect((await detail(req(), context)).status).toBe(404);
  expect(
    (
      await PATCH(
        req('PATCH', { expectedRevision: 1, patch: { title: 'New' } }),
        context
      )
    ).status
  ).toBe(404);
  expect(repo.saveTransition).not.toHaveBeenCalled();
});
it('validates id and requires revision before updates', async () => {
  expect(
    (await detail(req(), { params: Promise.resolve({ id: 'bad' }) })).status
  ).toBe(400);
  expect(
    (await PATCH(req('PATCH', { patch: { title: 'New' } }), context)).status
  ).toBe(400);
  expect(
    (
      await PATCH(
        req('PATCH', { expectedRevision: 2, patch: { title: 'New' } }),
        context
      )
    ).status
  ).toBe(409);
  expect(repo.saveTransition).not.toHaveBeenCalled();
});
it('passes checked old version and trusted actor into atomic save', async () => {
  const r = await PATCH(
    req('PATCH', { expectedRevision: 1, patch: { title: 'New' } }),
    context
  );
  expect(r.status).toBe(200);
  expect(repo.saveTransition).toHaveBeenCalledWith(
    fixture,
    expect.objectContaining({
      revision: 2,
      data: expect.objectContaining({ title: 'New' }),
    }),
    'owner'
  );
});
it('implements submit, approval, edited-active remoderation and archive', async () => {
  let result = await submit(req('POST', { expectedRevision: 1 }), context);
  expect((await result.json()).data.status).toBe('PENDING_MODERATION');
  (requireAdmin as jest.Mock).mockResolvedValue({
    userId: 'moderator',
    role: 'admin',
  });
  result = await moderate(
    req('POST', { expectedRevision: 1, decision: 'APPROVE' }),
    context
  );
  expect((await result.json()).data.status).toBe('ACTIVE');
  (repo.getOwned as jest.Mock).mockResolvedValue({
    ...fixture,
    status: 'ACTIVE',
  });
  result = await PATCH(
    req('PATCH', { expectedRevision: 1, patch: { title: 'Changed' } }),
    context
  );
  expect((await result.json()).data.status).toBe('PENDING_MODERATION');
  result = await archive(req('POST', { expectedRevision: 1 }), context);
  expect((await result.json()).data.status).toBe('ARCHIVED');
});
it('requires a moderator and blocks self-approval', async () => {
  expect((await queue(req())).status).toBe(403);
  expect(
    (
      await moderate(
        req('POST', { expectedRevision: 1, decision: 'APPROVE' }),
        context
      )
    ).status
  ).toBe(403);
  expect(repo.getForModeration).not.toHaveBeenCalled();
  (requireAdmin as jest.Mock).mockResolvedValue({
    userId: 'owner',
    role: 'admin',
  });
  expect(
    (
      await moderate(
        req('POST', { expectedRevision: 1, decision: 'APPROVE' }),
        context
      )
    ).status
  ).toBe(403);
  expect(repo.saveTransition).not.toHaveBeenCalled();
});
it('requires rejection reason and rejects injected role fields', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({
    userId: 'moderator',
    role: 'admin',
  });
  for (const body of [
    { expectedRevision: 1, decision: 'REJECT' },
    { expectedRevision: 1, decision: 'APPROVE', isAdmin: true },
  ])
    expect((await moderate(req('POST', body), context)).status).toBe(400);
});
it('handles racing writes and hides unexpected storage details', async () => {
  (repo.saveTransition as jest.Mock).mockRejectedValue(
    new repo.RepositoryError('CONFLICT')
  );
  expect(
    (await submit(req('POST', { expectedRevision: 1 }), context)).status
  ).toBe(409);
  (repo.listOwned as jest.Mock).mockRejectedValue(
    new Error('secret database details')
  );
  const r = await GET(req());
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('secret');
});
it('creates a draft with the server owner and returns 201', async () => {
  (repo.createDraft as jest.Mock).mockResolvedValue(fixture);
  const r = await POST(req('POST', { title: 'Draft' }));
  expect(r.status).toBe(201);
  expect(repo.createDraft).toHaveBeenCalledWith('owner', { title: 'Draft' });
});
it('rejects malformed JSON and strict action-body overrides', async () => {
  expect(
    (
      await POST(
        new Request('https://qaznedr.kz/api/equipment-listings', {
          method: 'POST',
          headers: {
            origin: 'https://qaznedr.kz',
            'content-type': 'application/json',
          },
          body: '{broken',
        })
      )
    ).status
  ).toBe(400);
  expect(
    (
      await submit(
        req('POST', { expectedRevision: 1, status: 'ACTIVE' }),
        context
      )
    ).status
  ).toBe(400);
  expect(
    (
      await PATCH(
        req('PATCH', { expectedRevision: 1, patch: { status: 'ACTIVE' } }),
        context
      )
    ).status
  ).toBe(400);
  expect(repo.saveTransition).not.toHaveBeenCalled();
});
it('does not permit a browser header to enable the feature', async () => {
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'false';
  expect(
    (
      await GET(
        req('GET', undefined, { EQUIPMENT_MARKETPLACE_ENABLED: 'true' })
      )
    ).status
  ).toBe(404);
  expect(repo.listOwned).not.toHaveBeenCalled();
});
it('blocks cross-origin moderation as well as owner writes', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({
    userId: 'moderator',
    role: 'admin',
  });
  expect(
    (
      await moderate(
        req(
          'POST',
          { expectedRevision: 1, decision: 'APPROVE' },
          { origin: 'https://evil.example' }
        ),
        context
      )
    ).status
  ).toBe(403);
  expect(repo.saveTransition).not.toHaveBeenCalled();
});
