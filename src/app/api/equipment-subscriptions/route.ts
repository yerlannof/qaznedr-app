import { emailDeliveryConfigured } from '@/lib/email/resend';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import {
  clientIp,
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';
import { subscribe } from '@/lib/equipment-listings/subscriptions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!equipmentCatalogEnabled() || !emailDeliveryConfigured())
    return publicReply({ status: 'off' }, 404);
  const read = await readPublicJson(request, 2048);
  if ('error' in read) return read.error;
  try {
    const result = await subscribe({
      email: read.body.email,
      filters: read.body.filters,
      locale: typeof read.body.locale === 'string' ? read.body.locale : 'ru',
      ip: clientIp(request),
    });
    if (result === 'invalid') return publicReply({ status: result }, 400);
    if (result === 'rate_limited') return publicReply({ status: result }, 429);
    return publicReply({ status: 'sent' });
  } catch {
    return publicReply({ status: 'failed' }, 502);
  }
}
