import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import {
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';
import { confirmSubscription } from '@/lib/equipment-listings/subscriptions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!equipmentCatalogEnabled()) return publicReply({ ok: false }, 404);
  const read = await readPublicJson(request, 512);
  if ('error' in read) return read.error;
  try {
    const ok = await confirmSubscription(read.body.token);
    return publicReply({ ok }, ok ? 200 : 404);
  } catch {
    return publicReply({ ok: false }, 503);
  }
}
