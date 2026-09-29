/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
jest.mock('@/lib/auth/admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/equipment-listings/repository', () => ({
  getOwned: jest.fn(),
  RepositoryError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
jest.mock('@/lib/equipment-listings/image-processing', () => ({
  MAX_IMAGE_BYTES: 3 * 1024 * 1024,
  processEquipmentImage: jest.fn(),
  ImageInputError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
jest.mock('@/lib/equipment-listings/image-repository', () => ({
  listImages: jest.fn(),
  storeImage: jest.fn(),
  readImage: jest.fn(),
  removeImage: jest.fn(),
  reorderImages: jest.fn(),
  moderationSnapshot: jest.fn(),
  readSnapshotImage: jest.fn(),
  ImageRepositoryError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
import { getServerSession } from 'next-auth';
import { requireAdmin } from '@/lib/auth/admin';
import { getOwned } from '@/lib/equipment-listings/repository';
import * as images from '@/lib/equipment-listings/image-repository';
import { PUT } from '@/app/api/equipment-listings/[id]/images/route';
import { DELETE } from '@/app/api/equipment-listings/[id]/images/[imageId]/route';
import { GET as adminList } from '@/app/api/admin/equipment-listings/[id]/images/route';
import { GET as adminRead } from '@/app/api/admin/equipment-listings/[id]/images/[imageId]/route';

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const imageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ownerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const context = { params: Promise.resolve({ id }) };
const imageContext = { params: Promise.resolve({ id, imageId }) };
const image = { id: imageId, width: 12, height: 8, bytes: 3, position: 0 };
const listing = { id, ownerId, revision: 1, status: 'ACTIVE' };
const url = `https://qaznedr.kz/api/equipment-listings/${id}/images`;
const mutation = (
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  new Request(url, {
    method,
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
const adminRequest = (revision = '1') =>
  new Request(`${url}?expectedRevision=${revision}`);

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: ownerId } });
  (getOwned as jest.Mock).mockResolvedValue(listing);
  (requireAdmin as jest.Mock).mockResolvedValue({
    userId: 'env-admin:a@example.com',
    role: 'super_admin',
  });
  (images.removeImage as jest.Mock).mockResolvedValue({
    revision: 2,
    status: 'PENDING_MODERATION',
  });
  (images.reorderImages as jest.Mock).mockResolvedValue({
    revision: 2,
    status: 'PENDING_MODERATION',
  });
  (images.moderationSnapshot as jest.Mock).mockResolvedValue({
    revision: 1,
    images: [image],
  });
  (images.readSnapshotImage as jest.Mock).mockResolvedValue(Buffer.from('abc'));
});
afterEach(() => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
});

it('keeps all new routes dark before auth and storage', async () => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  expect(
    (await PUT(mutation('PUT', { expectedRevision: 1, imageIds: [] }), context))
      .status
  ).toBe(404);
  expect(
    (await DELETE(mutation('DELETE', { expectedRevision: 1 }), imageContext))
      .status
  ).toBe(404);
  expect((await adminList(adminRequest(), context)).status).toBe(404);
  expect((await adminRead(adminRequest(), imageContext)).status).toBe(404);
  expect(getServerSession).not.toHaveBeenCalled();
  expect(requireAdmin).not.toHaveBeenCalled();
});

it('enforces owner, revision and exact JSON shape for mutations', async () => {
  for (const body of [
    { expectedRevision: 1, imageIds: [imageId, imageId] },
    { expectedRevision: 1, imageIds: [], extra: 1 },
    { expectedRevision: 0, imageIds: [] },
  ])
    expect((await PUT(mutation('PUT', body), context)).status).toBe(400);
  expect(
    (
      await DELETE(
        mutation('DELETE', { expectedRevision: 1, imageId }),
        imageContext
      )
    ).status
  ).toBe(400);
  expect(
    (
      await PUT(
        mutation(
          'PUT',
          { expectedRevision: 1, imageIds: [] },
          { origin: 'https://evil.test' }
        ),
        context
      )
    ).status
  ).toBe(403);
  (getOwned as jest.Mock).mockResolvedValue(null);
  expect(
    (await DELETE(mutation('DELETE', { expectedRevision: 1 }), imageContext))
      .status
  ).toBe(404);
  expect(images.removeImage).not.toHaveBeenCalled();
  expect(images.reorderImages).not.toHaveBeenCalled();
});

it('rejects oversized and malformed UTF-8 JSON before calling RPC', async () => {
  const tooLarge = mutation('PUT', {
    expectedRevision: 1,
    imageIds: [],
    padding: 'x'.repeat(4096),
  });
  expect((await PUT(tooLarge, context)).status).toBe(413);
  const invalid = new Request(url, {
    method: 'DELETE',
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'application/json',
    },
    body: Uint8Array.from([0x7b, 0xff, 0x7d]),
  });
  expect((await DELETE(invalid, imageContext)).status).toBe(400);
  expect(images.removeImage).not.toHaveBeenCalled();
  expect(images.reorderImages).not.toHaveBeenCalled();
});

it('passes only IDs and returns the RPC revision/status', async () => {
  const reordered = await PUT(
    mutation('PUT', { expectedRevision: 1, imageIds: [imageId] }),
    context
  );
  expect(reordered.status).toBe(200);
  expect(await reordered.json()).toEqual({
    success: true,
    data: { revision: 2, status: 'PENDING_MODERATION' },
  });
  expect(images.reorderImages).toHaveBeenCalledWith(id, ownerId, 1, [imageId]);
  const removed = await DELETE(
    mutation('DELETE', { expectedRevision: 1 }),
    imageContext
  );
  expect(removed.status).toBe(200);
  expect(images.removeImage).toHaveBeenCalledWith(id, ownerId, 1, imageId);
});

it('rejects stale or archived owner changes and maps SQL conflicts', async () => {
  expect(
    (await DELETE(mutation('DELETE', { expectedRevision: 2 }), imageContext))
      .status
  ).toBe(409);
  (getOwned as jest.Mock).mockResolvedValue({ ...listing, status: 'ARCHIVED' });
  expect(
    (await PUT(mutation('PUT', { expectedRevision: 1, imageIds: [] }), context))
      .status
  ).toBe(409);
  (getOwned as jest.Mock).mockResolvedValue(listing);
  (images.removeImage as jest.Mock).mockRejectedValue(
    new images.ImageRepositoryError('CONFLICT')
  );
  expect(
    (await DELETE(mutation('DELETE', { expectedRevision: 1 }), imageContext))
      .status
  ).toBe(409);
  (images.removeImage as jest.Mock).mockRejectedValue(
    new Error('storage/internal detail')
  );
  const unknown = await DELETE(
    mutation('DELETE', { expectedRevision: 1 }),
    imageContext
  );
  expect(unknown.status).toBe(503);
  expect(await unknown.text()).not.toContain('storage/internal detail');
  expect(unknown.headers.get('x-robots-tag')).toContain('noindex');
});

it('allows env-admin, requires version and projects safe snapshot metadata', async () => {
  const listed = await adminList(adminRequest(), context);
  expect(listed.status).toBe(200);
  expect(await listed.json()).toEqual({
    success: true,
    data: { revision: 1, images: [image] },
  });
  expect(images.moderationSnapshot).toHaveBeenCalledWith(id, 1);
  const read = await adminRead(adminRequest(), imageContext);
  expect(read.status).toBe(200);
  expect(read.headers.get('cache-control')).toContain('no-store');
  expect(read.headers.get('x-content-type-options')).toBe('nosniff');
  expect(images.readSnapshotImage).toHaveBeenCalledWith(id, imageId, 1);
  expect((await adminList(new Request(url), context)).status).toBe(400);
  (requireAdmin as jest.Mock).mockResolvedValue(null);
  expect((await adminList(adminRequest(), context)).status).toBe(403);
});

it('maps moderator stale and absent snapshots without leaking paths', async () => {
  (images.moderationSnapshot as jest.Mock).mockRejectedValue(
    new images.ImageRepositoryError('CONFLICT')
  );
  expect((await adminList(adminRequest(), context)).status).toBe(409);
  (images.readSnapshotImage as jest.Mock).mockResolvedValue(null);
  expect((await adminRead(adminRequest(), imageContext)).status).toBe(404);
  (images.moderationSnapshot as jest.Mock).mockRejectedValue(
    new images.ImageRepositoryError('NOT_FOUND')
  );
  expect((await adminList(adminRequest(), context)).status).toBe(404);
});
