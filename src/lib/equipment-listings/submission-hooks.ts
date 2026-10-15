import 'server-only';

import { after } from 'next/server';
import { notifyTelegram } from '@/lib/inquiries/notify';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import type { EquipmentListing } from './domain';
import { runPrecheck } from './precheck';
import { ownerEmailFor, savePrecheck } from './moderation-repository';
import { renderEmailLayout } from '@/lib/email/layout';
import { emailDeliveryConfigured, sendEmail } from '@/lib/email/resend';

export function moderationAlertText(listing: EquipmentListing): string {
  const data = listing.data;
  const section = data.category
    ? translate('ru', `equipmentIntake.${data.category}`)
    : '';
  return [
    'Новое объявление на модерации',
    [section, data.title].filter(Boolean).join(': '),
    data.region ? `Область: ${regionLabel(data.region, 'ru')}` : null,
    'https://qaznedr.kz/ru/admin/equipment',
  ]
    .filter(Boolean)
    .join('\n');
}

async function onSubmitted(listing: EquipmentListing): Promise<void> {
  await Promise.allSettled([
    notifyTelegram(moderationAlertText(listing)),
    runPrecheck(listing, process.env.ANTHROPIC_API_KEY).then((result) =>
      savePrecheck(listing.id, listing.revision, result)
    ),
  ]);
}

function runAfterResponse(work: () => Promise<void>): void {
  const task = () => work().catch(() => undefined);
  try {
    after(task);
  } catch {
    // Outside a request scope (scripts, tests) there is no after(); run detached.
    void task();
  }
}

/** Runs after the response is sent; a failure here never affects the owner's submission. */
export function afterSubmission(listing: EquipmentListing): void {
  runAfterResponse(() => onSubmitted(listing));
}

// Authors' language is not stored yet, so decisions go out in Russian.
export function moderationEmail(listing: EquipmentListing, locale = 'ru') {
  if (listing.status !== 'ACTIVE' && listing.status !== 'REJECTED') return null;
  const t = (key: string, params?: Record<string, string>) =>
    translate(locale, `marketplaceSignIn.${key}`, params);
  const title = listing.data.title?.trim() || listing.id.slice(0, 8);
  const approved = listing.status === 'ACTIVE';
  const button = approved
    ? {
        label: translate(locale, 'equipmentCabinet.open'),
        href: `https://qaznedr.kz/${locale}/equipment/${listing.id}`,
      }
    : {
        label: t('cabinetButton'),
        href: `https://qaznedr.kz/${locale}/equipment/my`,
      };
  return {
    subject: t(approved ? 'approvedSubject' : 'rejectedSubject', { title }),
    ...renderEmailLayout({
      lang: locale,
      paragraphs: approved
        ? [t('approvedText', { title })]
        : [
            t('rejectedText', {
              title,
              reason: listing.moderationNotes?.trim() || '—',
            }),
            t('rejectedHint'),
          ],
      button,
      footnotes: [],
    }),
  };
}

/** Tells the author about an approve/reject decision once e-mail is configured. */
export function afterModeration(listing: EquipmentListing): void {
  const message = moderationEmail(listing);
  if (!message || !emailDeliveryConfigured()) return;
  runAfterResponse(async () => {
    const to = await ownerEmailFor(listing.ownerId);
    if (to) await sendEmail({ to, ...message });
  });
}
