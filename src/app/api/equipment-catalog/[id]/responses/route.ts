import { after } from 'next/server';
import { z } from 'zod';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import {
  ownerOfActiveListing,
  responseSchema,
  submitResponse,
  type ResponseInput,
} from '@/lib/equipment-listings/engagement';
import { ownerEmailFor } from '@/lib/equipment-listings/moderation-repository';
import {
  clientIp,
  publicReply,
  readPublicJson,
} from '@/lib/equipment-listings/public-post';
import { renderEmailLayout } from '@/lib/email/layout';
import { emailDeliveryConfigured, sendEmail } from '@/lib/email/resend';
import { notifyTelegram } from '@/lib/inquiries/notify';
import { translate } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function notify(listingId: string, input: ResponseInput) {
  const listing = await ownerOfActiveListing(listingId);
  if (!listing) return;
  const url = `https://qaznedr.kz/ru/equipment/${listingId}`;
  const tasks: Promise<unknown>[] = [
    notifyTelegram(
      ['Новый отклик на заявку', listing.title, url].filter(Boolean).join('\n')
    ),
  ];
  if (emailDeliveryConfigured())
    tasks.push(
      ownerEmailFor(listing.ownerId).then((to) => {
        if (!to) return;
        const t = (key: string, params?: Record<string, string>) =>
          translate('ru', `equipmentResponses.${key}`, params);
        return sendEmail({
          to,
          subject: t('mailSubject', { title: listing.title }),
          ...renderEmailLayout({
            lang: 'ru',
            paragraphs: [
              t('mailIntro', { title: listing.title }),
              `${input.name}, ${input.phone}`,
              input.message,
            ],
            button: {
              label: t('mailButton'),
              href: 'https://qaznedr.kz/ru/equipment/my',
            },
            footnotes: [t('mailNote')],
          }),
        });
      })
    );
  await Promise.allSettled(tasks);
}

/** "Предложить" on a published WANTED request. */
export async function POST(request: Request, context: Context) {
  if (!equipmentCatalogEnabled()) return publicReply({ status: 'off' }, 404);
  const id = z
    .string()
    .uuid()
    .safeParse((await context.params).id);
  if (!id.success) return publicReply({ status: 'not_found' }, 404);
  const read = await readPublicJson(request, 4096);
  if ('error' in read) return read.error;
  const parsed = responseSchema.safeParse(read.body);
  if (!parsed.success) return publicReply({ status: 'invalid' }, 400);
  try {
    const result = await submitResponse(
      id.data,
      parsed.data,
      clientIp(request)
    );
    if (result === 'not_found') return publicReply({ status: result }, 404);
    if (result === 'rate_limited') return publicReply({ status: result }, 429);
    const task = () => notify(id.data, parsed.data).catch(() => undefined);
    try {
      after(task);
    } catch {
      void task();
    }
    return publicReply({ status: 'saved' });
  } catch {
    return publicReply({ status: 'failed' }, 503);
  }
}
