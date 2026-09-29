import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { EQUIPMENT_STATUSES, type EquipmentStatus } from './domain';

const BUCKET = 'equipment-images';
const MAX_BYTES = 3 * 1024 * 1024;
const uuid = z.string().uuid();
const imageRowSchema = z.object({
  id: uuid,
  listing_id: uuid,
  storage_path: z.string(),
  width: z.number().int().min(1).max(1600),
  height: z.number().int().min(1).max(1600),
  bytes: z.number().int().min(1).max(MAX_BYTES),
  position: z.number().int().min(0).max(7),
});
type ImageRow = z.infer<typeof imageRowSchema>;
export type EquipmentImage = Pick<
  ImageRow,
  'id' | 'width' | 'height' | 'bytes' | 'position'
>;
type DbError = { code?: string } | null;
type DbResult = { data: unknown; error: DbError };
type Query = PromiseLike<DbResult> & {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(count: number): Query;
  maybeSingle(): Promise<DbResult>;
};
type ImageBucket = {
  upload(
    path: string,
    body: Buffer,
    options: { contentType: string; upsert: boolean; cacheControl: string }
  ): Promise<{ error: unknown }>;
  download(path: string): Promise<{ data: Blob | null; error: unknown }>;
  remove(paths: string[]): Promise<{ error: unknown }>;
};
type ImageClient = {
  from(table: 'equipment_listing_images'): Query;
  rpc(
    name:
      | 'attach_equipment_image'
      | 'remove_equipment_image'
      | 'reorder_equipment_images'
      | 'equipment_moderation_images',
    args: Record<string, unknown>
  ): Promise<DbResult>;
  storage: { from(bucket: typeof BUCKET): ImageBucket };
};
export class ImageRepositoryError extends Error {
  constructor(
    public readonly code:
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'LIMIT'
      | 'INVALID'
      | 'UNAVAILABLE'
  ) {
    super(code);
    this.name = 'ImageRepositoryError';
  }
}
async function client(): Promise<ImageClient> {
  return (await createServiceClient()) as unknown as ImageClient;
}
function requireId(id: string): void {
  if (!uuid.safeParse(id).success) throw new ImageRepositoryError('NOT_FOUND');
}
function failure(error: DbError): ImageRepositoryError {
  return new ImageRepositoryError(
    error?.code === '40001'
      ? 'CONFLICT'
      : error?.code === '54000'
        ? 'LIMIT'
        : error?.code === 'P0002'
          ? 'NOT_FOUND'
          : error?.code === '22023'
            ? 'INVALID'
            : 'UNAVAILABLE'
  );
}
function hydrate(value: unknown, listingId: string): ImageRow {
  const parsed = imageRowSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.listing_id !== listingId ||
    parsed.data.storage_path !== `${listingId}/${parsed.data.id}.webp`
  )
    throw new ImageRepositoryError('UNAVAILABLE');
  return parsed.data;
}
function safeImage(row: ImageRow): EquipmentImage {
  return {
    id: row.id,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    position: row.position,
  };
}
const COLUMNS = 'id,listing_id,storage_path,width,height,bytes,position';
async function findImage(
  db: ImageClient,
  listingId: string,
  imageId: string
): Promise<ImageRow | null> {
  const result = await db
    .from('equipment_listing_images')
    .select(COLUMNS)
    .eq('listing_id', listingId)
    .eq('id', imageId)
    .maybeSingle();
  if (result.error) throw failure(result.error);
  return result.data === null ? null : hydrate(result.data, listingId);
}

/** Call only after the HTTP layer has established the listing owner. No paths leave this boundary. */
export async function listImages(listingId: string): Promise<EquipmentImage[]> {
  requireId(listingId);
  const db = await client();
  const result = await db
    .from('equipment_listing_images')
    .select(COLUMNS)
    .eq('listing_id', listingId)
    .order('position', { ascending: true })
    .limit(9);
  if (result.error) throw failure(result.error);
  if (!Array.isArray(result.data) || result.data.length > 8)
    throw new ImageRepositoryError('UNAVAILABLE');
  return result.data.map((row) => safeImage(hydrate(row, listingId)));
}

/** RPC rechecks owner/revision/count under the listing lock; the earlier HTTP check is insufficient. */
export async function storeImage(
  listingId: string,
  ownerId: string,
  expectedRevision: number,
  input: { buffer: Buffer; width: number; height: number }
): Promise<{
  image: EquipmentImage;
  revision: number;
  status: EquipmentStatus;
}> {
  requireId(listingId);
  requireId(ownerId);
  if (
    !Number.isInteger(expectedRevision) ||
    expectedRevision < 1 ||
    expectedRevision > 2147483646 ||
    !Buffer.isBuffer(input.buffer) ||
    input.buffer.length < 1 ||
    input.buffer.length > MAX_BYTES ||
    !Number.isInteger(input.width) ||
    input.width < 1 ||
    input.width > 1600 ||
    !Number.isInteger(input.height) ||
    input.height < 1 ||
    input.height > 1600
  )
    throw new ImageRepositoryError('UNAVAILABLE');
  const db = await client();
  const imageId = randomUUID();
  const path = `${listingId}/${imageId}.webp`;
  const bucket = db.storage.from(BUCKET);
  try {
    const uploaded = await bucket.upload(path, input.buffer, {
      contentType: 'image/webp',
      upsert: false,
      cacheControl: '0',
    });
    if (uploaded.error) throw new ImageRepositoryError('UNAVAILABLE');
  } catch {
    // An uncertain upload may leave a private object; retention reconciliation handles it.
    // No database row was attached and no arbitrary path is ever removed.
    throw new ImageRepositoryError('UNAVAILABLE');
  }
  let rollbackConfirmed = false;
  try {
    const attached = await db.rpc('attach_equipment_image', {
      p_listing_id: listingId,
      p_owner_id: ownerId,
      p_expected_revision: expectedRevision,
      p_image_id: imageId,
      p_storage_path: path,
      p_width: input.width,
      p_height: input.height,
      p_bytes: input.buffer.length,
    });
    if (attached.error) {
      // These PostgreSQL errors abort this statement/transaction. An SDK transport
      // failure or a malformed successful reply does not establish rollback.
      rollbackConfirmed = [
        '40001',
        '54000',
        'P0002',
        '22023',
        '23505',
      ].includes(attached.error.code ?? '');
      throw failure(attached.error);
    }
    const result = z
      .object({
        image: z.unknown(),
        revision: z.number().int().positive(),
        status: z.enum(EQUIPMENT_STATUSES),
      })
      .parse(attached.data);
    const image = hydrate(result.image, listingId);
    if (
      image.id !== imageId ||
      result.revision !== expectedRevision + 1 ||
      result.status === 'ACTIVE' ||
      result.status === 'ARCHIVED'
    )
      throw new ImageRepositoryError('UNAVAILABLE');
    return {
      image: safeImage(image),
      revision: result.revision,
      status: result.status,
    };
  } catch (error) {
    // A concurrent SELECT can return null while an uncertain RPC is still running.
    // Never delete on that evidence alone: a late commit would reference missing bytes.
    if (!rollbackConfirmed) throw new ImageRepositoryError('UNAVAILABLE');
    // Even after confirmed rollback, preserve any existing attachment with this ID.
    let unreferenced: boolean;
    try {
      unreferenced = (await findImage(db, listingId, imageId)) === null;
    } catch {
      throw new ImageRepositoryError('UNAVAILABLE');
    }
    if (!unreferenced) throw new ImageRepositoryError('UNAVAILABLE');
    try {
      const cleanup = await bucket.remove([path]);
      if (cleanup.error) throw new ImageRepositoryError('UNAVAILABLE');
    } catch {
      throw new ImageRepositoryError('UNAVAILABLE');
    }
    throw error instanceof ImageRepositoryError
      ? error
      : new ImageRepositoryError('UNAVAILABLE');
  }
}

/** Caller rechecks listing ownership on every read; no short-lived link bypasses that check. */
export async function readImage(
  listingId: string,
  imageId: string
): Promise<Buffer | null> {
  requireId(listingId);
  requireId(imageId);
  const db = await client();
  const image = await findImage(db, listingId, imageId);
  if (!image) return null;
  try {
    const result = await db.storage.from(BUCKET).download(image.storage_path);
    if (result.error || !result.data || result.data.size !== image.bytes)
      throw new ImageRepositoryError('UNAVAILABLE');
    return Buffer.from(await result.data.arrayBuffer());
  } catch {
    throw new ImageRepositoryError('UNAVAILABLE');
  }
}

const revisionSchema = z
  .object({
    revision: z.number().int().positive().max(2147483647),
    status: z.enum(EQUIPMENT_STATUSES),
  })
  .strict();

function requireRevision(revision: number): void {
  if (!Number.isInteger(revision) || revision < 1 || revision > 2147483646)
    throw new ImageRepositoryError('INVALID');
}

async function revisionMutation(
  name: 'remove_equipment_image' | 'reorder_equipment_images',
  listingId: string,
  ownerId: string,
  expectedRevision: number,
  args: Record<string, unknown>,
  allowNoop: boolean
): Promise<{ revision: number; status: EquipmentStatus }> {
  requireId(listingId);
  requireId(ownerId);
  requireRevision(expectedRevision);
  const db = await client();
  let result: DbResult;
  try {
    result = await db.rpc(name, {
      p_listing_id: listingId,
      p_owner_id: ownerId,
      p_expected_revision: expectedRevision,
      ...args,
    });
  } catch {
    throw new ImageRepositoryError('UNAVAILABLE');
  }
  if (result.error) throw failure(result.error);
  const parsed = revisionSchema.safeParse(result.data);
  if (
    !parsed.success ||
    (parsed.data.revision !== expectedRevision + 1 &&
      !(allowNoop && parsed.data.revision === expectedRevision)) ||
    parsed.data.status === 'ARCHIVED' ||
    (parsed.data.revision === expectedRevision + 1 &&
      !['DRAFT', 'PENDING_MODERATION', 'REJECTED'].includes(parsed.data.status))
  )
    throw new ImageRepositoryError('UNAVAILABLE');
  return parsed.data;
}

/** SQL deletes the attachment and queues its exact storage path; this never removes bytes inline. */
export async function removeImage(
  listingId: string,
  ownerId: string,
  expectedRevision: number,
  imageId: string
) {
  requireId(imageId);
  return revisionMutation(
    'remove_equipment_image',
    listingId,
    ownerId,
    expectedRevision,
    { p_image_id: imageId },
    false
  );
}

export async function reorderImages(
  listingId: string,
  ownerId: string,
  expectedRevision: number,
  imageIds: string[]
) {
  if (
    !Array.isArray(imageIds) ||
    imageIds.length > 8 ||
    new Set(imageIds).size !== imageIds.length ||
    !imageIds.every((id) => uuid.safeParse(id).success)
  )
    throw new ImageRepositoryError('INVALID');
  return revisionMutation(
    'reorder_equipment_images',
    listingId,
    ownerId,
    expectedRevision,
    { p_image_ids: imageIds },
    true
  );
}

type ModerationSnapshot = { revision: number; images: EquipmentImage[] };
async function snapshotRows(
  listingId: string,
  expectedRevision: number
): Promise<{ revision: number; rows: ImageRow[] }> {
  requireId(listingId);
  requireRevision(expectedRevision);
  let result: DbResult;
  try {
    result = await (
      await client()
    ).rpc('equipment_moderation_images', {
      p_listing_id: listingId,
      p_expected_revision: expectedRevision,
    });
  } catch {
    throw new ImageRepositoryError('UNAVAILABLE');
  }
  if (result.error) throw failure(result.error);
  const parsed = z
    .object({ revision: z.number().int(), images: z.array(z.unknown()).max(8) })
    .safeParse(result.data);
  if (!parsed.success || parsed.data.revision !== expectedRevision)
    throw new ImageRepositoryError('UNAVAILABLE');
  const rows = parsed.data.images.map((value) => hydrate(value, listingId));
  if (
    new Set(rows.map((row) => row.id)).size !== rows.length ||
    rows.some((row, index) => row.position !== index)
  )
    throw new ImageRepositoryError('UNAVAILABLE');
  return { revision: parsed.data.revision, rows };
}

/** Call only after requireAdmin; the RPC verifies PENDING_MODERATION and version. */
export async function moderationSnapshot(
  listingId: string,
  expectedRevision: number
): Promise<ModerationSnapshot> {
  const snapshot = await snapshotRows(listingId, expectedRevision);
  return { revision: snapshot.revision, images: snapshot.rows.map(safeImage) };
}

/** Download only the path confirmed by a fresh moderation snapshot. */
export async function readSnapshotImage(
  listingId: string,
  imageId: string,
  expectedRevision: number
): Promise<Buffer | null> {
  requireId(imageId);
  const snapshot = await snapshotRows(listingId, expectedRevision);
  const row = snapshot.rows.find((image) => image.id === imageId);
  if (!row) return null;
  try {
    const result = await (await client()).storage
      .from(BUCKET)
      .download(row.storage_path);
    if (result.error || !result.data || result.data.size !== row.bytes)
      throw new ImageRepositoryError('UNAVAILABLE');
    return Buffer.from(await result.data.arrayBuffer());
  } catch {
    throw new ImageRepositoryError('UNAVAILABLE');
  }
}
