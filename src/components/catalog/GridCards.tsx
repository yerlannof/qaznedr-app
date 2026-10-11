import Image from 'next/image';
import CatalogGridCard from './CatalogGridCard';
import PlotOutline from '@/components/prospecting/PlotOutline';
import ZoneMap from '@/components/showcase/ZoneMap';
import { verifiedOn } from '@/lib/catalog/verified';
import { translate } from '@/lib/i18n/translations';
import {
  commodityLabel,
  formatRightsDate,
  pickList,
  pickText,
  splitHeadline,
  type Showcase,
} from '@/lib/leads/showcase';
import { showcaseRegionId } from '@/lib/leads/showcase-regions';
import type { AssetOffer } from '@/lib/offers/contract';
import type { Plot } from '@/lib/prospecting/plots';
import {
  formatArea,
  formatDate,
  placeLine,
  plotPath,
} from '@/lib/prospecting/present';
import type { Locale } from '@/lib/seo/site';

// Source data → CatalogGridCard. Cards only pick and split the approved text
// of each source; nothing is recomposed (showcase contract, copy red lines).

type Common = { locale: Locale; headingLevel?: 'h2' | 'h3' };

const tr = (locale: Locale) => (key: string, p?: Record<string, unknown>) =>
  translate(locale, key, p);

export function ProspectingGridCard({
  plot,
  locale,
  headingLevel,
}: Common & { plot: Plot }) {
  const t = tr(locale);
  const ha = t('prospecting.ha');
  return (
    <CatalogGridCard
      locale={locale}
      headingLevel={headingLevel}
      code={plot.code}
      href={`/${locale}${plotPath(plot.code)}`}
      media={<PlotOutline plot={plot} locale={locale} fill />}
      verifiedOn={verifiedOn(plot.code)}
      statusLabel={
        plot.status === 'matched' ? t('catalogGrid.crewFound') : undefined
      }
      kindLabel={`${t('prospecting.kind')} · ${t(
        plot.status === 'open'
          ? 'prospecting.statusOpen'
          : 'prospecting.statusMatched'
      )}`}
      title={t('prospecting.cardTitle', {
        area: formatArea(plot.area_ha, locale),
      })}
      where={placeLine(plot, locale)}
      commodity={{ label: t('prospecting.mineral'), gold: true }}
      figures={[
        {
          label: t('prospecting.cardArea'),
          value: `${formatArea(plot.area_ha, locale)} ${ha}`,
        },
        {
          label: t('prospecting.cardValidUntil'),
          value: formatDate(plot.valid_until),
        },
      ]}
      footLeft={
        plot.published_at
          ? t('catalogGrid.published', { date: formatDate(plot.published_at) })
          : ''
      }
      footRight={t('catalogGrid.shareByContract')}
    />
  );
}

export function OfferGridCard({
  offer,
  locale,
  headingLevel,
}: Common & { offer: AssetOffer }) {
  const t = tr(locale);
  const pick = (v: Parameters<typeof pickText>[0]) => pickText(v, locale);
  const title = pick(offer.title);
  const badge = pick(offer.badge);
  const summary = pick(offer.summary_line);
  const cover = offer.video
    ? offer.video.poster
    : (offer.images[0]?.url ?? null);
  return (
    <CatalogGridCard
      locale={locale}
      headingLevel={headingLevel}
      code={offer.code}
      href={`/${locale}/offers/${offer.code}`}
      media={
        cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null
      }
      verifiedOn={verifiedOn(offer.code)}
      kindLabel={badge.text}
      title={title.text}
      titleLang={title.lang}
      where={summary.text}
      whereLang={summary.lang}
      commodity={{
        label: commodityLabel(offer.commodity, locale),
        gold: offer.commodity.includes('Au'),
      }}
      figures={offer.key_figures.slice(0, 2).map((fig) => {
        const value = pick(fig.value);
        const label = pick(fig.label);
        return { value: value.text, label: label.text, lang: label.lang };
      })}
      footLeft={t('catalogGrid.published', {
        date: formatDate(offer.published_at),
      })}
      footRight={t('catalogGrid.priceOnRequest')}
    />
  );
}

export function ShowcaseGridCard({
  card,
  locale,
  headingLevel,
}: Common & { card: Showcase }) {
  const t = tr(locale);
  const oblast = pickText(card.oblast, locale);
  const headline = pickText(card.headline, locale);
  const parts = splitHeadline(headline.text);
  // The number never travels without its caveat: the one chosen by the
  // geobase for the home page, otherwise the card's first fact.
  // The number never travels without its caveats: on the home page the one
  // line the geobase chose (featured), elsewhere every fact of the card.
  const facts = pickList(card.facts, locale);
  const caveats = card.featured
    ? [pickText(card.featured.fact, locale)]
    : facts.items.map((text) => ({ text, lang: facts.lang }));
  const label = commodityLabel(card.commodity, locale, card.commodity_ru);
  return (
    <CatalogGridCard
      locale={locale}
      headingLevel={headingLevel}
      code={card.card_id}
      href={`/${locale}/leads/${card.card_id}`}
      media={
        <ZoneMap
          zones={[card.zone]}
          highlight={showcaseRegionId(card.oblast.ru)}
          view="region"
          label={t('showcase.cardMapLabel', { oblast: oblast.text })}
          className="h-full w-full"
        />
      }
      verifiedOn={verifiedOn(card.card_id)}
      kindLabel={t('catalog.kinds.find')}
      title={`${label} — ${oblast.text}`}
      where={t('catalogGrid.zoneApprox')}
      commodity={{ label, gold: card.commodity.includes('Au') }}
      figures={[
        parts.type
          ? { label: parts.type, value: parts.value, lang: headline.lang }
          : { label: '', value: headline.text, lang: headline.lang },
      ]}
      notes={[
        ...caveats.map((c) => ({ text: c.text, lang: c.lang })),
        {
          text: t('showcase.rightsChecked', {
            date: formatRightsDate(card.rights.checked_at),
          }),
        },
      ]}
      footLeft=""
      footRight={t('catalogGrid.afterNda')}
    />
  );
}
