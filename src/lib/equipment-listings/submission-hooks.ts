import 'server-only';

import { after } from 'next/server';
import { notifyTelegram } from '@/lib/inquiries/notify';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import type { EquipmentListing } from './domain';
import { runPrecheck } from './precheck';
import { savePrecheck } from './moderation-repository';

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

/** Runs after the response is sent; a failure here never affects the owner's submission. */
export function afterSubmission(listing: EquipmentListing): void {
  const task = () => onSubmitted(listing).catch(() => undefined);
  try {
    after(task);
  } catch {
    // Outside a request scope (scripts, tests) there is no after(); run detached.
    void task();
  }
}
