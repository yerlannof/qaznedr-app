/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
import { createServiceClient } from '@/lib/supabase/server';
import {
  ImageRepositoryError,
  listImages,
  readImage,
  storeImage,
  removeImage,
  reorderImages,
  moderationSnapshot,
  readSnapshotImage,
} from '@/lib/equipment-listings/image-repository';

const listingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const imageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ownerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const row = {
  id: imageId,
  listing_id: listingId,
  storage_path: `${listingId}/${imageId}.webp`,
  width: 12,
  height: 8,
  bytes: 3,
  position: 0,
};
let query: Record<string, jest.Mock>;
let db: { from: jest.Mock; rpc: jest.Mock; storage: { from: jest.Mock } };
let bucket: { upload: jest.Mock; download: jest.Mock; remove: jest.Mock };
beforeEach(() => {
  jest.clearAllMocks();
  query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
    then: jest.fn((resolve) => resolve({ data: [row], error: null })),
  };
  for (const method of ['select', 'eq', 'order', 'limit'])
    query[method].mockReturnValue(query);
  bucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    download: jest.fn().mockResolvedValue({
      data: new Blob(['abc'], { type: 'image/webp' }),
      error: null,
    }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };
  db = {
    from: jest.fn().mockReturnValue(query),
    rpc: jest.fn().mockImplementation(async (_name, args) => ({
      data: {
        image: {
          ...row,
          id: args.p_image_id,
          storage_path: args.p_storage_path,
        },
        revision: 2,
        status: 'DRAFT',
      },
      error: null,
    })),
    storage: { from: jest.fn().mockReturnValue(bucket) },
  };
  (createServiceClient as jest.Mock).mockResolvedValue(db);
});

it('returns ordered safe metadata without private storage paths or ownership', async () => {
  expect(await listImages(listingId)).toEqual([
    { id: imageId, width: 12, height: 8, bytes: 3, position: 0 },
  ]);
  expect(query.eq).toHaveBeenCalledWith('listing_id', listingId);
  expect(query.order).toHaveBeenCalledWith('position', { ascending: true });
});

it('creates the private object with generated UUID then attaches against the exact revision', async () => {
  const result = await storeImage(listingId, ownerId, 1, {
    buffer: Buffer.from('abc'),
    width: 12,
    height: 8,
  });
  expect(db.storage.from).toHaveBeenCalledWith('equipment-images');
  const [path, bytes, options] = bucket.upload.mock.calls[0];
  expect(path).toMatch(new RegExp(`^${listingId}/[a-f0-9-]{36}\\.webp$`));
  expect(bytes).toEqual(Buffer.from('abc'));
  expect(options).toEqual({
    contentType: 'image/webp',
    upsert: false,
    cacheControl: '0',
  });
  expect(db.rpc).toHaveBeenCalledWith(
    'attach_equipment_image',
    expect.objectContaining({
      p_listing_id: listingId,
      p_owner_id: ownerId,
      p_expected_revision: 1,
      p_storage_path: path,
      p_width: 12,
      p_height: 8,
      p_bytes: 3,
    })
  );
  expect(result.revision).toBe(2);
  expect(result.image).not.toHaveProperty('storage_path');
});

it('removes only the generated unreferenced object on a revision/count race', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  for (const [code, mapped] of [
    ['40001', 'CONFLICT'],
    ['54000', 'LIMIT'],
  ]) {
    db.rpc.mockResolvedValue({ data: null, error: { code } });
    await expect(
      storeImage(listingId, ownerId, 1, {
        buffer: Buffer.from('abc'),
        width: 12,
        height: 8,
      })
    ).rejects.toMatchObject({ code: mapped });
    const path = bucket.upload.mock.calls.at(-1)![0];
    expect(bucket.remove).toHaveBeenLastCalledWith([path]);
  }
});

it('does not remove a committed attachment if the RPC reply is lost', async () => {
  db.rpc.mockImplementation(async (_name, args) => {
    query.maybeSingle.mockResolvedValue({
      data: { ...row, id: args.p_image_id, storage_path: args.p_storage_path },
      error: null,
    });
    throw new Error('transport lost');
  });
  await expect(
    storeImage(listingId, ownerId, 1, {
      buffer: Buffer.from('abc'),
      width: 12,
      height: 8,
    })
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  expect(bucket.remove).not.toHaveBeenCalled();
});

it('leaves a private object for reconciliation when attachment state cannot be read', async () => {
  db.rpc.mockRejectedValue(new Error('transport lost'));
  query.maybeSingle.mockResolvedValue({
    data: null,
    error: { code: 'connection' },
  });
  await expect(
    storeImage(listingId, ownerId, 1, {
      buffer: Buffer.from('abc'),
      width: 12,
      height: 8,
    })
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  expect(bucket.remove).not.toHaveBeenCalled();
});

it('does not treat an empty concurrent read as rollback of an uncertain RPC', async () => {
  db.rpc.mockRejectedValue(new Error('transport lost while SQL still running'));
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  await expect(
    storeImage(listingId, ownerId, 1, {
      buffer: Buffer.from('abc'),
      width: 12,
      height: 8,
    })
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  expect(bucket.remove).not.toHaveBeenCalled();
});

it('does not call RPC after failed storage upload and hides SDK details', async () => {
  bucket.upload.mockResolvedValue({
    error: { message: 'private bucket details' },
  });
  await expect(
    storeImage(listingId, ownerId, 1, {
      buffer: Buffer.from('abc'),
      width: 12,
      height: 8,
    })
  ).rejects.toEqual(new ImageRepositoryError('UNAVAILABLE'));
  expect(db.rpc).not.toHaveBeenCalled();
});

it('queries image and listing together before reading bytes', async () => {
  expect(await readImage(listingId, imageId)).toEqual(Buffer.from('abc'));
  expect(query.eq).toHaveBeenCalledWith('listing_id', listingId);
  expect(query.eq).toHaveBeenCalledWith('id', imageId);
  expect(bucket.download).toHaveBeenCalledWith(row.storage_path);
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  bucket.download.mockClear();
  expect(await readImage(listingId, imageId)).toBeNull();
  expect(bucket.download).not.toHaveBeenCalled();
});

it('rejects corrupted/path-injected rows and unexpected download sizes', async () => {
  query.maybeSingle.mockResolvedValue({
    data: { ...row, storage_path: '../other.webp' },
    error: null,
  });
  await expect(readImage(listingId, imageId)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
  expect(bucket.download).not.toHaveBeenCalled();
  query.maybeSingle.mockResolvedValue({ data: row, error: null });
  bucket.download.mockResolvedValue({
    data: new Blob(['different size']),
    error: null,
  });
  await expect(readImage(listingId, imageId)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
});

it('bounds trusted input and IDs before any service call', async () => {
  await expect(
    storeImage('../evil', ownerId, 1, {
      buffer: Buffer.from('abc'),
      width: 12,
      height: 8,
    })
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    storeImage(listingId, ownerId, 1, {
      buffer: Buffer.alloc(0),
      width: 12,
      height: 8,
    })
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  expect(createServiceClient).not.toHaveBeenCalled();
});

it('deletes by server-side RPC without any inline storage cleanup', async () => {
  db.rpc.mockResolvedValue({
    data: { revision: 2, status: 'PENDING_MODERATION' },
    error: null,
  });
  expect(await removeImage(listingId, ownerId, 1, imageId)).toEqual({
    revision: 2,
    status: 'PENDING_MODERATION',
  });
  expect(db.rpc).toHaveBeenCalledWith('remove_equipment_image', {
    p_listing_id: listingId,
    p_owner_id: ownerId,
    p_expected_revision: 1,
    p_image_id: imageId,
  });
  expect(db.storage.from).not.toHaveBeenCalled();
  expect(bucket.remove).not.toHaveBeenCalled();
  db.rpc.mockRejectedValue(new Error('unknown commit outcome'));
  await expect(
    removeImage(listingId, ownerId, 1, imageId)
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  expect(bucket.remove).not.toHaveBeenCalled();
});

it('passes only complete ID sequence and accepts confirmed no-op revision', async () => {
  db.rpc.mockResolvedValue({
    data: { revision: 1, status: 'ACTIVE' },
    error: null,
  });
  expect(await reorderImages(listingId, ownerId, 1, [imageId])).toEqual({
    revision: 1,
    status: 'ACTIVE',
  });
  expect(db.rpc).toHaveBeenCalledWith('reorder_equipment_images', {
    p_listing_id: listingId,
    p_owner_id: ownerId,
    p_expected_revision: 1,
    p_image_ids: [imageId],
  });
  await expect(
    reorderImages(listingId, ownerId, 1, [imageId, imageId])
  ).rejects.toMatchObject({ code: 'INVALID' });
  db.rpc.mockResolvedValue({
    data: { revision: 3, status: 'PENDING_MODERATION' },
    error: null,
  });
  await expect(
    reorderImages(listingId, ownerId, 1, [imageId])
  ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
});

it('accepts a committed image change while listing remains REJECTED', async () => {
  db.rpc.mockResolvedValue({
    data: { revision: 2, status: 'REJECTED' },
    error: null,
  });
  expect(await removeImage(listingId, ownerId, 1, imageId)).toEqual({
    revision: 2,
    status: 'REJECTED',
  });
  expect(await reorderImages(listingId, ownerId, 1, [imageId])).toEqual({
    revision: 2,
    status: 'REJECTED',
  });
});

it('gets moderator snapshot and downloads only a path present in that snapshot', async () => {
  db.rpc.mockResolvedValue({
    data: { revision: 1, images: [row] },
    error: null,
  });
  expect(await moderationSnapshot(listingId, 1)).toEqual({
    revision: 1,
    images: [{ id: imageId, width: 12, height: 8, bytes: 3, position: 0 }],
  });
  expect(await readSnapshotImage(listingId, imageId, 1)).toEqual(
    Buffer.from('abc')
  );
  expect(db.rpc).toHaveBeenCalledWith('equipment_moderation_images', {
    p_listing_id: listingId,
    p_expected_revision: 1,
  });
  expect(bucket.download).toHaveBeenCalledWith(row.storage_path);
  bucket.download.mockClear();
  expect(await readSnapshotImage(listingId, ownerId, 1)).toBeNull();
  expect(bucket.download).not.toHaveBeenCalled();
  db.rpc.mockResolvedValue({
    data: { revision: 2, images: [row] },
    error: null,
  });
  await expect(moderationSnapshot(listingId, 1)).rejects.toMatchObject({
    code: 'UNAVAILABLE',
  });
});

it('maps SQL mutation and snapshot errors without leaking internals', async () => {
  for (const [code, mapped] of [
    ['P0002', 'NOT_FOUND'],
    ['40001', 'CONFLICT'],
    ['22023', 'INVALID'],
  ]) {
    db.rpc.mockResolvedValue({ data: null, error: { code } });
    await expect(
      removeImage(listingId, ownerId, 1, imageId)
    ).rejects.toMatchObject({ code: mapped });
    await expect(moderationSnapshot(listingId, 1)).rejects.toMatchObject({
      code: mapped,
    });
  }
});

it('rejects malformed moderator rows before any private download', async () => {
  const malformedSnapshots = [
    { revision: 1, images: [{ ...row, storage_path: '../wrong.webp' }] },
    { revision: 1, images: [row, { ...row, position: 1 }] },
    { revision: 1, images: [{ ...row, position: 1 }] },
    { revision: 1, images: [{ ...row, listing_id: ownerId }] },
  ];
  for (const data of malformedSnapshots) {
    db.rpc.mockResolvedValue({ data, error: null });
    await expect(
      readSnapshotImage(listingId, imageId, 1)
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(bucket.download).not.toHaveBeenCalled();
  }
});

it('fails closed on impossible successful mutation replies without inline removal', async () => {
  for (const data of [
    null,
    { revision: 3, status: 'REJECTED' },
    { revision: 2, status: 'ACTIVE' },
    { revision: 2, status: 'ARCHIVED' },
  ]) {
    db.rpc.mockResolvedValue({ data, error: null });
    await expect(
      removeImage(listingId, ownerId, 1, imageId)
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(db.storage.from).not.toHaveBeenCalled();
    expect(bucket.remove).not.toHaveBeenCalled();
  }
});
