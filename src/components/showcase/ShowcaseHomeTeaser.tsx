import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import HeadlineBlock from './HeadlineBlock';
import { translate } from '@/lib/i18n/translations';
import {
  commodityLabel,
  formatRightsDate,
  pickText,
  type Showcase,
} from '@/lib/leads/showcase';
import type { Locale } from '@/lib/seo/site';

/** Home teaser: number with its type plus the one caveat chosen by the geobase. */
export default function ShowcaseHomeTeaser({
  card,
  locale,
}: {
  card: Showcase;
  locale: Locale;
}) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const oblast = pickText(card.oblast, locale);
  const headline = pickText(card.headline, locale);
  const fact = card.featured ? pickText(card.featured.fact, locale) : null;
  return (
    <article className="border-t border-brand-line pt-6">
      <p className="text-sm text-brand-muted">
        {card.card_id} · <span lang={oblast.lang}>{oblast.text}</span>
      </p>
      <h3 className="font-serif text-3xl mt-4">
        {commodityLabel(card.commodity, locale)}
      </h3>
      <div className="mt-4">
        <HeadlineBlock
          text={headline.text}
          lang={headline.lang}
          type={card.headline_type}
        />
      </div>
      {fact && (
        <p lang={fact.lang} className="holding-lead mt-3">
          {fact.text}
        </p>
      )}
      <p className="text-sm text-brand-muted mt-4">
        {t('showcase.rightsChecked', {
          date: formatRightsDate(card.rights.checked_at),
        })}
      </p>
      <Link
        href={`/${locale}/leads/${card.card_id}`}
        className="inline-flex min-h-12 items-center gap-3 mt-5 font-semibold"
      >
        {t('leadCard.open')} {card.card_id}
        <ArrowUpRight aria-hidden className="w-5 h-5" />
      </Link>
    </article>
  );
}
