import 'server-only';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z, ZodError } from 'zod';
import { authOptions } from '@/lib/services/auth.config';
import { requireModerator } from '@/lib/auth/admin';
import { SITE_URL } from '@/lib/seo/site';
import {
  archiveListing,
  editListing,
  moderateListing,
  ownerDraftSchema,
  submitListing,
} from './domain';
import * as repository from './repository';
import {
  TRUST_MARKS,
  prechecksFor,
  setTrustMark,
  trustMarksFor,
} from './moderation-repository';
import { afterModeration, afterSubmission } from './submission-hooks';

export type ItemContext = { params: Promise<{ id: string }> };
type Action =
  | 'list'
  | 'create'
  | 'detail'
  | 'edit'
  | 'submit'
  | 'archive'
  | 'queue'
  | 'moderate'
  | 'trust';
class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
const version = z.number().int().positive().max(2147483646);
const revisionBody = z.object({ expectedRevision: version }).strict();
const editBody = revisionBody
  .extend({ patch: z.record(z.string(), z.unknown()) })
  .strict();
const moderationBody = revisionBody
  .extend({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine((value) => value.decision !== 'REJECT' || !!value.reason);
const trustBody = z
  .object({
    mark: z.enum(TRUST_MARKS),
    enabled: z.boolean(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

async function jsonBody(request: Request): Promise<unknown> {
  // Check a configured origin, never a caller-controlled Host/forwarded header.
  const allowedOrigin = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  if (
    request.headers.get('origin') !== allowedOrigin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new HttpError(403, 'Forbidden origin');
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new HttpError(415, 'JSON required');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Invalid input');
  let bytes = 0;
  let content = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32768) {
        await reader.cancel();
        throw new HttpError(413, 'Request too large');
      }
      content += decoder.decode(value, { stream: true });
    }
    content += decoder.decode();
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Invalid input');
  } finally {
    reader.releaseLock();
  }
}

export function equipmentHandler(action: Action) {
  return async (request: Request, context?: ItemContext) => {
    // No authentication or storage calls while the closed-launch flag is off.
    if (process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true')
      return response({ success: false, error: 'Not found' }, 404);
    try {
      const adminAction =
        action === 'queue' || action === 'moderate' || action === 'trust';
      let actorId: string;
      if (adminAction) {
        const admin = await requireModerator();
        if (!admin) throw new HttpError(403, 'Forbidden');
        actorId = admin.userId;
      } else {
        const session = await getServerSession(authOptions);
        const id = (session?.user as { id?: unknown } | undefined)?.id;
        if (typeof id !== 'string' || !id.trim())
          throw new HttpError(401, 'Unauthorized');
        actorId = id;
      }
      if (action === 'list') {
        const listings = await repository.listOwned(actorId);
        // Trust marks are public anyway; a failure here must not hide the owner's list.
        const trustMarks = await trustMarksFor(
          listings.map((listing) => listing.id)
        ).catch(() => ({}));
        return response({
          success: true,
          data: listings,
          trustMarks,
          limit: 100,
        });
      }
      if (action === 'queue') {
        const status =
          new URL(request.url).searchParams.get('status') === 'ACTIVE'
            ? 'ACTIVE'
            : 'PENDING_MODERATION';
        const listings = await repository.listByStatus(status);
        const [trustMarks, prechecks] = await Promise.all([
          trustMarksFor(listings.map((listing) => listing.id)),
          prechecksFor(listings),
        ]);
        return response({
          success: true,
          data: listings,
          trustMarks,
          prechecks,
          limit: 100,
        });
      }
      if (action === 'create') {
        const input = ownerDraftSchema.parse(await jsonBody(request));
        return response(
          { success: true, data: await repository.createDraft(actorId, input) },
          201
        );
      }
      const id = z
        .string()
        .uuid()
        .parse((await context?.params)?.id);
      if (action === 'trust') {
        const body = trustBody.parse(await jsonBody(request));
        const listing = await repository.getModeratable(id);
        if (!listing) throw new HttpError(404, 'Not found');
        await setTrustMark(id, body.mark, body.enabled, actorId, body.note);
        return response({
          success: true,
          data: (await trustMarksFor([id]))[id] ?? [],
        });
      }
      const input = action === 'detail' ? null : await jsonBody(request);
      const parsed =
        action === 'detail'
          ? null
          : action === 'edit'
            ? editBody.parse(input)
            : action === 'moderate'
              ? moderationBody.parse(input)
              : revisionBody.parse(input);
      const previous = adminAction
        ? await repository.getForModeration(id)
        : await repository.getOwned(id, actorId);
      if (!previous || (!adminAction && previous.ownerId !== actorId))
        throw new HttpError(404, 'Not found');
      if (action === 'detail')
        return response({ success: true, data: previous });
      if (parsed!.expectedRevision !== previous.revision)
        throw new HttpError(409, 'Listing changed; reload before retrying');
      if (action === 'moderate' && previous.ownerId === actorId)
        throw new HttpError(403, 'Self-moderation is not allowed');
      let next;
      try {
        switch (action) {
          case 'edit':
            next = editListing(previous, actorId, editBody.parse(input).patch);
            break;
          case 'submit':
            next = submitListing(previous, actorId);
            break;
          case 'archive':
            next = archiveListing(previous, actorId);
            break;
          case 'moderate': {
            const decision = moderationBody.parse(input);
            next = moderateListing(
              previous,
              { actorId, isAdmin: true },
              decision.decision,
              decision.expectedRevision,
              decision.reason
            );
            break;
          }
          default:
            throw new HttpError(400, 'Invalid action');
        }
      } catch (error) {
        if (error instanceof ZodError || error instanceof HttpError)
          throw error;
        throw new HttpError(409, 'Action not allowed in current state');
      }
      const saved =
        next === previous
          ? previous
          : await repository.saveTransition(previous, next, actorId);
      if (
        saved.status === 'PENDING_MODERATION' &&
        previous.status !== 'PENDING_MODERATION'
      )
        afterSubmission(saved);
      if (action === 'moderate' && saved !== previous) afterModeration(saved);
      return response({ success: true, data: saved });
    } catch (error) {
      if (error instanceof HttpError)
        return response({ success: false, error: error.message }, error.status);
      if (error instanceof ZodError)
        return response({ success: false, error: 'Invalid input' }, 400);
      if (error instanceof repository.RepositoryError) {
        const status =
          error.code === 'CONFLICT'
            ? 409
            : error.code === 'NOT_FOUND'
              ? 404
              : 503;
        return response(
          {
            success: false,
            error:
              status === 409
                ? 'Listing changed; reload before retrying'
                : status === 404
                  ? 'Not found'
                  : 'Service unavailable',
          },
          status
        );
      }
      return response({ success: false, error: 'Service unavailable' }, 503);
    }
  };
}
