/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/services/auth.config', () => ({ authOptions: {} }));
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
  ImageRepositoryError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

import { getServerSession } from 'next-auth';
import { getOwned } from '@/lib/equipment-listings/repository';
import * as images from '@/lib/equipment-listings/image-repository';
import { processEquipmentImage } from '@/lib/equipment-listings/image-processing';
import {
  GET as list,
  POST as upload,
} from '@/app/api/equipment-listings/[id]/images/route';
import { GET as read } from '@/app/api/equipment-listings/[id]/images/[imageId]/route';

const id = '00000000-0000-4000-8000-000000000001';
const imageId = '00000000-0000-4000-8000-000000000002';
const ownerId = '00000000-0000-4000-8000-000000000003';
const context = { params: Promise.resolve({ id }) };
const imageContext = { params: Promise.resolve({ id, imageId }) };
const metadata = { id: imageId, width: 12, height: 10, bytes: 50, position: 0 };
const listing = { id, ownerId, revision: 1, status: 'DRAFT' };

function request(
  method = 'GET',
  body?: BodyInit,
  headers: Record<string, string> = {}
) {
  return new Request(`https://qaznedr.kz/api/equipment-listings/${id}/images`, {
    method,
    headers: {
      origin: 'https://qaznedr.kz',
      'content-type': 'image/png',
      'x-listing-revision': '1',
      ...headers,
    },
    ...(body === undefined ? {} : { body }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EQUIPMENT_MARKETPLACE_ENABLED = 'true';
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: ownerId } });
  (getOwned as jest.Mock).mockResolvedValue(listing);
  (images.listImages as jest.Mock).mockResolvedValue([metadata]);
  (images.readImage as jest.Mock).mockResolvedValue(Buffer.from('webp'));
  (images.storeImage as jest.Mock).mockResolvedValue({
    image: metadata,
    revision: 2,
    status: 'DRAFT',
  });
  (processEquipmentImage as jest.Mock).mockResolvedValue({
    buffer: Buffer.from('webp'),
    width: 12,
    height: 10,
  });
});
afterEach(() => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
});

it('returns 404 before auth or storage while feature is closed', async () => {
  delete process.env.EQUIPMENT_MARKETPLACE_ENABLED;
  expect((await list(request(), context)).status).toBe(404);
  expect(
    (await upload(request('POST', Buffer.from('x')), context)).status
  ).toBe(404);
  expect((await read(request(), imageContext)).status).toBe(404);
  expect(getServerSession).not.toHaveBeenCalled();
  expect(getOwned).not.toHaveBeenCalled();
});

it('requires UUID session and listing ids and checks ownership before any image access', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  expect((await list(request(), context)).status).toBe(401);
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { id: 'invalid' },
  });
  expect((await list(request(), context)).status).toBe(401);
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: ownerId } });
  expect(
    (await list(request(), { params: Promise.resolve({ id: 'bad' }) })).status
  ).toBe(400);
  (getOwned as jest.Mock).mockResolvedValue(null);
  expect((await list(request(), context)).status).toBe(404);
  expect((await read(request(), imageContext)).status).toBe(404);
  (getOwned as jest.Mock).mockResolvedValue(listing);
  expect(
    (
      await read(request(), {
        params: Promise.resolve({ id, imageId: 'bad' }),
      })
    ).status
  ).toBe(400);
  expect(images.listImages).not.toHaveBeenCalled();
  expect(images.readImage).not.toHaveBeenCalled();
});

it('projects only safe metadata and serves private image bytes', async () => {
  (images.listImages as jest.Mock).mockResolvedValue([
    { ...metadata, storagePath: 'secret', ownerId },
  ]);
  const listed = await list(request(), context);
  expect(listed.status).toBe(200);
  expect(await listed.json()).toEqual({ success: true, data: [metadata] });
  const binary = await read(request(), imageContext);
  expect(binary.status).toBe(200);
  expect(binary.headers.get('content-type')).toBe('image/webp');
  expect(binary.headers.get('x-content-type-options')).toBe('nosniff');
  for (const response of [listed, binary]) {
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  }
  expect(images.readImage).toHaveBeenCalledWith(id, imageId);
});

it('rejects archived or stale uploads and full listings before reading body', async () => {
  (getOwned as jest.Mock).mockResolvedValue({ ...listing, status: 'ARCHIVED' });
  expect(
    (await upload(request('POST', Buffer.from('x')), context)).status
  ).toBe(409);
  (getOwned as jest.Mock).mockResolvedValue(listing);
  expect(
    (
      await upload(
        request('POST', Buffer.from('x'), { 'x-listing-revision': '2' }),
        context
      )
    ).status
  ).toBe(409);
  (images.listImages as jest.Mock).mockResolvedValue(Array(8).fill(metadata));
  expect(
    (await upload(request('POST', Buffer.from('x')), context)).status
  ).toBe(409);
  expect(processEquipmentImage).not.toHaveBeenCalled();
});

it('requires exact origin, safe fetch site, supported type, and strict revision', async () => {
  for (const headers of [
    { origin: 'https://evil.example' },
    { origin: '' },
    { 'sec-fetch-site': 'cross-site' },
  ])
    expect(
      (await upload(request('POST', Buffer.from('x'), headers), context)).status
    ).toBe(403);
  expect(
    (
      await upload(
        request('POST', Buffer.from('x'), { 'content-type': 'image/svg+xml' }),
        context
      )
    ).status
  ).toBe(415);
  for (const revision of ['0', '-1', '1.0', '1e0', '2147483647', ''])
    expect(
      (
        await upload(
          request('POST', Buffer.from('x'), { 'x-listing-revision': revision }),
          context
        )
      ).status
    ).toBe(400);
  expect(images.storeImage).not.toHaveBeenCalled();
});

it('bounds streamed bytes despite Content-Length and returns safe upload result', async () => {
  const oversized = Buffer.alloc(3 * 1024 * 1024 + 1);
  expect(
    (
      await upload(
        request('POST', oversized, { 'content-length': '1' }),
        context
      )
    ).status
  ).toBe(413);
  expect(processEquipmentImage).not.toHaveBeenCalled();
  const response = await upload(request('POST', Buffer.from('valid')), context);
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({
    success: true,
    data: { image: metadata, revision: 2, status: 'DRAFT' },
  });
  expect(images.storeImage).toHaveBeenCalledWith(id, ownerId, 1, {
    buffer: Buffer.from('webp'),
    width: 12,
    height: 10,
  });
});

it('cancels the raw request stream once the byte limit is crossed', async () => {
  const cancel = jest.fn();
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024));
    },
    cancel,
  });
  const streamed = new Request(
    `https://qaznedr.kz/api/equipment-listings/${id}/images`,
    {
      method: 'POST',
      headers: {
        origin: 'https://qaznedr.kz',
        'content-type': 'image/png',
        'x-listing-revision': '1',
        'content-length': '1',
      },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' }
  );
  expect((await upload(streamed, context)).status).toBe(413);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(processEquipmentImage).not.toHaveBeenCalled();
});

it('maps repository conflicts and hides unexpected errors', async () => {
  (images.storeImage as jest.Mock).mockRejectedValue(
    new images.ImageRepositoryError('CONFLICT')
  );
  expect(
    (await upload(request('POST', Buffer.from('x')), context)).status
  ).toBe(409);
  (images.readImage as jest.Mock).mockRejectedValue(
    new Error('private storage path')
  );
  const response = await read(request(), imageContext);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private storage path');
});
