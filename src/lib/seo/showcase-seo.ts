import { translate } from '@/lib/i18n/translations';
import {
  commodityLabel,
  formatRightsDate,
  pickText,
  type Showcase,
} from '@/lib/leads/showcase';
import type { Locale } from './site';

/** Title/description for a showcase card: its own words, no added claims. */
export function showcaseSeoText(
  card: Showcase,
  locale: Locale
): { title: string; description: string } {
  const oblast = pickText(card.oblast, locale).text;
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
  const title = clean(
    translate(locale, 'showcase.seoTitle', {
      commodity: commodityLabel(card.commodity, locale, card.commodity_ru),
      code: card.card_id,
      oblast,
    })
  );
  const full = clean(
    translate(locale, 'showcase.seoDescription', {
      headline: pickText(card.headline, locale).text,
      oblast,
      date: formatRightsDate(card.rights.checked_at),
      code: card.card_id,
    })
  );
  const description =
    full.length <= 200 ? full : `${full.slice(0, 199).replace(/\s+\S*$/, '')}…`;
  return { title, description };
}
