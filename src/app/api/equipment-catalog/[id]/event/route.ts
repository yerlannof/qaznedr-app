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

/**
 * Views (once per browser session, from ViewBeacon) and contact clicks
 * (call / WhatsApp, from ContactBeacon) sent by the listing page.
 */
export async function POST(request: Request, context: Context) {
  if (!equipmentCatalogEnabled()) return publicReply({ ok: false }, 404);
  const read = await readPublicJson(request, 256);
  if ('error' in read) return read.error;
  const kind = read.body.kind;
  if (kind !== 'contact' && kind !== 'view')
    return publicReply({ ok: false }, 400);
  if (BOT_AGENT.test(request.headers.get('user-agent') ?? ''))
    return publicReply({ ok: true });
  try {
    await recordListingEvent((await context.params).id, kind);
    return publicReply({ ok: true });
  } catch {
    return publicReply({ ok: false }, 503);
  }
}
