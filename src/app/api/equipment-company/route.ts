import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import {
  companyInputSchema,
  getOwnCompany,
  saveOwnCompany,
} from '@/lib/equipment-listings/companies';
import {
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';

export const dynamic = 'force-dynamic';

async function ownerId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: unknown } | undefined)?.id;
  return typeof id === 'string' && id.trim() ? id : null;
}
const enabled = () => process.env.EQUIPMENT_MARKETPLACE_ENABLED === 'true';

/** The signed-in author's company profile (null until created). */
export async function GET() {
  if (!enabled()) return publicReply({ success: false }, 404);
  const owner = await ownerId();
  if (!owner) return publicReply({ success: false }, 401);
  try {
    return publicReply({ success: true, data: await getOwnCompany(owner) });
  } catch {
    return publicReply({ success: false }, 503);
  }
}

/** Saving sends the profile to moderation again. */
export async function PUT(request: Request) {
  if (!enabled()) return publicReply({ success: false }, 404);
  const owner = await ownerId();
  if (!owner) return publicReply({ success: false }, 401);
  const read = await readPublicJson(request, 8192);
  if ('error' in read) return read.error;
  const parsed = companyInputSchema.safeParse(read.body);
  if (!parsed.success) return publicReply({ success: false }, 400);
  try {
    return publicReply({
      success: true,
      data: await saveOwnCompany(owner, parsed.data),
    });
  } catch {
    return publicReply({ success: false }, 503);
  }
}
