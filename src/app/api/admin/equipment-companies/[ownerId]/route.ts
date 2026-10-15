import { z } from 'zod';
import { requireModerator } from '@/lib/auth/admin';
import {
  COMPANY_STATUSES,
  setCompanyStatus,
} from '@/lib/equipment-listings/companies';
import {
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ ownerId: string }> };

/** Approve (ACTIVE) or hide a company profile. */
export async function POST(request: Request, context: Context) {
  if (process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true')
    return publicReply({ success: false }, 404);
  if (!(await requireModerator())) return publicReply({ success: false }, 403);
  const read = await readPublicJson(request, 256);
  if ('error' in read) return read.error;
  const body = z
    .object({ status: z.enum(COMPANY_STATUSES) })
    .strict()
    .safeParse(read.body);
  const owner = z
    .string()
    .min(1)
    .max(160)
    .safeParse((await context.params).ownerId);
  if (!body.success || !owner.success)
    return publicReply({ success: false }, 400);
  try {
    await setCompanyStatus(owner.data, body.data.status);
    return publicReply({ success: true });
  } catch {
    return publicReply({ success: false }, 503);
  }
}
