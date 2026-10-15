import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import {
  BOT_AGENT,
  recordListingEvent,
} from '@/lib/equipment-listings/engagement';
import {
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

/** Contact clicks (call / WhatsApp) sent by the listing page. */
export async function POST(request: Request, context: Context) {
  if (!equipmentCatalogEnabled()) return publicReply({ ok: false }, 404);
  const read = await readPublicJson(request, 256);
  if ('error' in read) return read.error;
  if (read.body.kind !== 'contact') return publicReply({ ok: false }, 400);
  if (BOT_AGENT.test(request.headers.get('user-agent') ?? ''))
    return publicReply({ ok: true });
  try {
    await recordListingEvent((await context.params).id, 'contact');
    return publicReply({ ok: true });
  } catch {
    return publicReply({ ok: false }, 503);
  }
}
