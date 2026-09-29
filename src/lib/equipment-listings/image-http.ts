import 'server-only';

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/services/auth.config';
import { SITE_URL } from '@/lib/seo/site';
import { getOwned, RepositoryError } from './repository';
import {
  ImageInputError,
  MAX_IMAGE_BYTES,
  processEquipmentImage,
} from './image-processing';
import * as images from './image-repository';

export type ImagesContext = { params: Promise<{ id: string }> };
export type ImageContext = { params: Promise<{ id: string; imageId: string }> };
type Action = 'list' | 'upload' | 'read';

class ImageHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: privateHeaders });
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUuid = (value: unknown): value is string =>
  typeof value === 'string' && uuid.test(value);

function safeImage(image: images.EquipmentImage) {
  return {
    id: image.id,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    position: image.position,
  };
}

function uploadHeaders(request: Request): { revision: number; mime: string } {
  const allowedOrigin = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  if (
    request.headers.get('origin') !== allowedOrigin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new ImageHttpError(403, 'Forbidden origin');

  const mime = request.headers.get('content-type')?.trim().toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime ?? ''))
    throw new ImageHttpError(415, 'Unsupported image type');
  const value = request.headers.get('x-listing-revision');
  if (!value || !/^[1-9]\d*$/.test(value))
    throw new ImageHttpError(400, 'Invalid revision');
  const revision = Number(value);
  if (!Number.isSafeInteger(revision) || revision > 2147483646)
    throw new ImageHttpError(400, 'Invalid revision');
  return { revision, mime: mime! };
}

async function boundedBody(request: Request): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new ImageHttpError(400, 'Invalid image');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new ImageHttpError(413, 'Request too large');
      }
      chunks.push(value);
    }
    if (bytes === 0) throw new ImageHttpError(400, 'Invalid image');
    return Buffer.concat(chunks, bytes);
  } catch (error) {
    if (error instanceof ImageHttpError) throw error;
    throw new ImageHttpError(400, 'Invalid image');
  } finally {
    reader.releaseLock();
  }
}

export function imageHandler(action: Action) {
  return async (request: Request, context: ImagesContext | ImageContext) => {
    if (process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true')
      return json({ success: false, error: 'Not found' }, 404);
    try {
      const session = await getServerSession(authOptions);
      const ownerId = (session?.user as { id?: unknown } | undefined)?.id;
      if (!validUuid(ownerId)) throw new ImageHttpError(401, 'Unauthorized');

      const params = await context.params;
      if (!validUuid(params.id)) throw new ImageHttpError(400, 'Invalid id');
      const imageId = 'imageId' in params ? params.imageId : undefined;
      if (action === 'read' && !validUuid(imageId))
        throw new ImageHttpError(400, 'Invalid id');
      const upload = action === 'upload' ? uploadHeaders(request) : null;

      const listing = await getOwned(params.id, ownerId);
      if (!listing || listing.ownerId !== ownerId)
        throw new ImageHttpError(404, 'Not found');

      if (action === 'list') {
        const records = await images.listImages(params.id);
        return json({ success: true, data: records.map(safeImage) });
      }
      if (action === 'read') {
        const buffer = await images.readImage(params.id, imageId!);
        if (!buffer) throw new ImageHttpError(404, 'Not found');
        return new Response(Uint8Array.from(buffer), {
          status: 200,
          headers: { ...privateHeaders, 'Content-Type': 'image/webp' },
        });
      }

      if (
        listing.status === 'ARCHIVED' ||
        listing.revision !== upload!.revision
      )
        throw new ImageHttpError(
          409,
          'Listing changed; reload before retrying'
        );
      const records = await images.listImages(params.id);
      if (records.length >= 8)
        throw new ImageHttpError(409, 'Image limit reached');
      const input = await boundedBody(request);
      const processed = await processEquipmentImage(input, upload!.mime);
      const saved = await images.storeImage(
        params.id,
        ownerId,
        upload!.revision,
        processed
      );
      return json(
        {
          success: true,
          data: {
            image: safeImage(saved.image),
            revision: saved.revision,
            status: saved.status,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof ImageHttpError)
        return json({ success: false, error: error.message }, error.status);
      if (error instanceof ImageInputError) {
        const status =
          error.code === 'TOO_LARGE'
            ? 413
            : error.code === 'UNSUPPORTED'
              ? 415
              : 400;
        return json(
          {
            success: false,
            error: status === 413 ? 'Request too large' : 'Invalid image',
          },
          status
        );
      }
      if (
        error instanceof images.ImageRepositoryError ||
        error instanceof RepositoryError
      ) {
        const status =
          error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'CONFLICT' || error.code === 'LIMIT'
              ? 409
              : 503;
        return json(
          {
            success: false,
            error:
              status === 404
                ? 'Not found'
                : status === 409
                  ? 'Listing changed; reload before retrying'
                  : 'Service unavailable',
          },
          status
        );
      }
      return json({ success: false, error: 'Service unavailable' }, 503);
    }
  };
}
