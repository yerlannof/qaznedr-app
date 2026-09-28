import 'server-only';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z, ZodError } from 'zod';
import { authOptions } from '@/lib/services/auth.config';
import { SITE_URL } from '@/lib/seo/site';
import {
  getOwnProfile,
  updateOwnProfile,
  profilePatchSchema,
  profileSetupSchema,
} from './own-profile';

class ProfileHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

async function readPatch(request?: Request): Promise<unknown> {
  if (!request) throw new ProfileHttpError(400, 'Invalid input');
  const origin = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  if (
    request.headers.get('origin') !== origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new ProfileHttpError(403, 'Forbidden origin');
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new ProfileHttpError(415, 'JSON required');
  const reader = request.body?.getReader();
  if (!reader) throw new ProfileHttpError(400, 'Invalid input');
  let size = 0;
  let text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new ProfileHttpError(413, 'Request too large');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof ProfileHttpError) throw error;
    throw new ProfileHttpError(400, 'Invalid input');
  } finally {
    reader.releaseLock();
  }
}

export function ownProfileHandler(action: 'get' | 'update' | 'setup') {
  return async (request?: Request) => {
    if (process.env.MARKETPLACE_IDENTITY_ENABLED !== 'true')
      return response({ success: false, error: 'Not found' }, 404);
    try {
      const session = await getServerSession(authOptions);
      const parsedId = z
        .string()
        .uuid()
        .safeParse((session?.user as { id?: unknown } | undefined)?.id);
      if (!parsedId.success) throw new ProfileHttpError(401, 'Unauthorized');
      const userId = parsedId.data;
      const profile =
        action === 'get'
          ? await getOwnProfile(userId)
          : await updateOwnProfile(
              userId,
              (action === 'setup'
                ? profileSetupSchema
                : profilePatchSchema
              ).parse(await readPatch(request))
            );
      if (!profile) throw new ProfileHttpError(404, 'Profile not found');
      return response(
        action === 'setup' ? { success: true, data: profile } : { profile }
      );
    } catch (error) {
      if (error instanceof ProfileHttpError)
        return response({ success: false, error: error.message }, error.status);
      if (error instanceof ZodError)
        return response({ success: false, error: 'Invalid input' }, 400);
      return response({ success: false, error: 'Service unavailable' }, 503);
    }
  };
}
