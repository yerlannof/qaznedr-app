/** @jest-environment node */
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, PUT } from '@/app/api/profile/route';
import { POST } from '@/app/api/profile/setup/route';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
jest.mock('@/lib/auth/own-profile', () => ({
  ...jest.requireActual('@/lib/auth/own-profile'),
  getOwnProfile: jest.fn(),
  updateOwnProfile: jest.fn(),
}));
import { getOwnProfile, updateOwnProfile } from '@/lib/auth/own-profile';
const read = getOwnProfile as jest.Mock;
const update = updateOwnProfile as jest.Mock;
const userId = '00000000-0000-4000-8000-000000000001';
const session = getServerSession as jest.Mock;
const request = (body: unknown = {}, headers: Record<string, string> = {}) =>
  new NextRequest('https://qaznedr.kz/api/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  jest.clearAllMocks();
  process.env.MARKETPLACE_IDENTITY_ENABLED = 'true';
  process.env.NEXTAUTH_URL = 'https://qaznedr.kz';
  session.mockResolvedValue({
    user: { id: userId, email: 'member@example.invalid' },
  });
  read.mockResolvedValue({ id: userId, full_name: 'Member' });
  update.mockResolvedValue({ id: userId, full_name: 'Changed' });
});
afterEach(() => {
  delete process.env.MARKETPLACE_IDENTITY_ENABLED;
  delete process.env.NEXTAUTH_URL;
});
it('keeps all profile methods closed before auth while pilot is off', async () => {
  delete process.env.MARKETPLACE_IDENTITY_ENABLED;
  expect((await GET()).status).toBe(404);
  expect((await PUT(request())).status).toBe(404);
  expect((await POST(request())).status).toBe(404);
  expect(session).not.toHaveBeenCalled();
});
it('rejects a session with email but no canonical id', async () => {
  session.mockResolvedValue({ user: { email: 'member@example.invalid' } });
  expect((await GET()).status).toBe(401);
});
it('requires same origin for mutations', async () => {
  expect((await PUT(request({ full_name: 'Member' }))).status).toBe(403);
  expect(
    (
      await POST(
        request(
          { profile_type: 'investor' },
          { origin: 'https://evil.example' }
        )
      )
    ).status
  ).toBe(403);
});
it('rejects attempts to change protected fields', async () => {
  expect(
    (
      await PUT(
        request(
          { role: 'super_admin', full_name: 'Member' },
          { origin: 'https://qaznedr.kz' }
        )
      )
    ).status
  ).toBe(400);
});
it('reads only the canonical session owner and makes every response private', async () => {
  const res = await GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    profile: { id: userId, full_name: 'Member' },
  });
  expect(read).toHaveBeenCalledWith(userId);
  expect(res.headers.get('cache-control')).toBe('private, no-store');
  expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
});
it.each([
  null,
  { user: {} },
  { user: { id: 'env-admin:owner@example.invalid' } },
  { user: { id: 42 } },
])('rejects missing or noncanonical owner %j', async (value) => {
  session.mockResolvedValue(value);
  expect(
    (
      await PUT(
        request({ full_name: 'Member' }, { origin: 'https://qaznedr.kz' })
      )
    ).status
  ).toBe(401);
  expect(read).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
it('writes only normalized allowed fields to session owner then reads saved profile', async () => {
  let saved = { id: userId, full_name: 'Member', phone: null as string | null };
  update.mockImplementation(async (id, patch) => {
    expect(id).toBe(userId);
    saved = { ...saved, ...patch };
    return saved;
  });
  read.mockImplementation(async () => saved);
  const res = await PUT(
    request(
      { full_name: ' Changed ', phone: '+77001234567' },
      { origin: 'https://qaznedr.kz' }
    )
  );
  expect(res.status).toBe(200);
  expect(update).toHaveBeenCalledWith(userId, {
    full_name: 'Changed',
    phone: '+77001234567',
  });
  expect((await (await GET()).json()).profile.full_name).toBe('Changed');
});
it.each([
  {},
  { id: '00000000-0000-4000-8000-000000000002' },
  { email: 'other@example.invalid' },
  { is_verified: true },
  { avatar_url: 'https://example.com/a.png' },
  { full_name: ' ' },
  { phone: '7001234567' },
  { website: 'javascript:alert(1)' },
  null,
  [],
])('rejects invalid/protected patch %j', async (body) => {
  expect(
    (await PUT(request(body, { origin: 'https://qaznedr.kz' }))).status
  ).toBe(400);
  expect(update).not.toHaveBeenCalled();
});
it('restricts setup to profile type and keeps its existing envelope', async () => {
  const res = await POST(
    request(
      { profile_type: 'service_provider' },
      { origin: 'https://qaznedr.kz' }
    )
  );
  expect(res.status).toBe(200);
  expect((await res.json()).success).toBe(true);
  expect(update).toHaveBeenCalledWith(userId, {
    profile_type: 'service_provider',
  });
  update.mockClear();
  expect(
    (
      await POST(
        request(
          { profile_type: 'investor', full_name: 'Unexpected' },
          { origin: 'https://qaznedr.kz' }
        )
      )
    ).status
  ).toBe(400);
  expect(update).not.toHaveBeenCalled();
});
it.each([
  { origin: 'https://evil.example' },
  { origin: 'null' },
  { origin: 'https://qaznedr.kz', 'sec-fetch-site': 'cross-site' },
])('rejects untrusted origin %j', async (headers) => {
  expect((await PUT(request({ full_name: 'Member' }, headers))).status).toBe(
    403
  );
  expect(update).not.toHaveBeenCalled();
});
it('rejects non-JSON, malformed JSON, invalid UTF-8 and empty bodies', async () => {
  expect(
    (
      await PUT(
        request(
          {},
          { origin: 'https://qaznedr.kz', 'content-type': 'text/plain' }
        )
      )
    ).status
  ).toBe(415);
  for (const body of ['{', new Uint8Array([0xff]), null]) {
    const req = new Request('https://qaznedr.kz/api/profile', {
      method: 'PUT',
      headers: {
        origin: 'https://qaznedr.kz',
        'content-type': 'application/json',
      },
      body,
    });
    expect((await PUT(req)).status).toBe(400);
  }
  expect(update).not.toHaveBeenCalled();
});
it('enforces byte limit without trusting content-length and cancels chunked input', async () => {
  const cancel = jest.fn();
  let n = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(c) {
      n++;
      c.enqueue(new Uint8Array(9000).fill(32));
    },
    cancel,
  });
  const req = new Request('https://qaznedr.kz/api/profile', {
    method: 'PUT',
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
      'content-length': '1',
    },
    body: stream,
    duplex: 'half',
  } as RequestInit);
  expect((await PUT(req)).status).toBe(413);
  expect(cancel).toHaveBeenCalled();
  expect(n).toBeLessThanOrEqual(3);
  expect(update).not.toHaveBeenCalled();
});
it('distinguishes absent profile from storage failure without leaking details', async () => {
  read.mockResolvedValue(null);
  expect((await GET()).status).toBe(404);
  update.mockResolvedValue(null);
  expect(
    (
      await PUT(
        request({ full_name: 'Member' }, { origin: 'https://qaznedr.kz' })
      )
    ).status
  ).toBe(404);
  read.mockRejectedValue(new Error('private database secret'));
  const res = await GET();
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('private database');
  expect(res.headers.get('cache-control')).toContain('no-store');
});
