import Link from 'next/link';
import { ArrowUpRight, FileSearch, X } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadCard from '@/components/cards/LeadCard';
import CatalogFilters, {
  SortSelect,
  type FilterOption,
} from '@/components/catalog/CatalogFilters';
import OfferCard from '@/components/offers/OfferCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import ShowcaseDisclaimer from '@/components/showcase/ShowcaseDisclaimer';
import ZoneMap from '@/components/showcase/ZoneMap';
import { legacyLeads } from '@/components/showcase/ShowcaseList';
import { REGIONS } from '@/lib/data/filter-config';
import { getContactConfig } from '@/lib/config/contacts';
import {
  activeFilterCount,
  catalogQuery,
  facetCounts,
  filterCatalog,
  parseCatalogParams,
  type CatalogParams,
  type CatalogSort,
} from '@/lib/catalog/filter';
import { fromAssetOffer } from '@/lib/catalog/sources/offers';
import { fromShowcaseLead } from '@/lib/catalog/sources/showcase';
import { fromProspectingPlot } from '@/lib/catalog/sources/prospecting';
import ProspectingCard from '@/components/prospecting/ProspectingCard';
import { listPublicPlots, type Plot } from '@/lib/prospecting/plots';
import {
  CATALOG_KINDS,
  type CatalogItem,
  type CatalogKind,
} from '@/lib/catalog/types';
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { MINERAL_HUBS, hubMineralName } from '@/lib/leads/minerals';
import { parseShowcase, type Showcase } from '@/lib/leads/showcase';
import { listPublishedOffers } from '@/lib/offers';
import type { AssetOffer } from '@/lib/offers/contract';
import { leadMineralName } from '@/lib/seo/lead-metadata';
import { HREFLANG, localeUrl, toLocale, type Locale } from '@/lib/seo/site';
import { getServerTranslation } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';

function regionLabel(id: string, locale: Locale): string {
  return REGIONS.find((r) => r.id === id)?.name[locale] ?? id;
}

function options(
  ids: Iterable<string>,
  counts: Record<string, number>,
  label: (id: string) => string
): FilterOption[] {
  return Array.from(new Set(ids))
    .map((id) => ({ id, label: label(id) }))
    .sort(
      (a, b) =>
        (counts[b.id] ?? 0) - (counts[a.id] ?? 0) ||
        a.label.localeCompare(b.label)
    );
}

/** Unified catalogue: our finds, artisanal plots and assets for sale (design 18). */
export default async function LeadsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = toLocale((await params).locale);
  const filters = parseCatalogParams(await searchParams);
  const { t } = getServerTranslation(locale);
  const contacts = getContactConfig();

  // Sources. The showcase list is small (hard cap 50) and fully loaded, so
  // filtering, counting and ordering happen here, uniformly for every kind.
  const { leads } = await listPublishedLeads({ limit: 50 });
  const showcases = new Map<string, Showcase>();
  const items: CatalogItem[] = [];
  for (const lead of leads) {
    const card = parseShowcase(lead.showcase);
    if (!card) continue;
    showcases.set(card.card_id, card);
    items.push(fromShowcaseLead(lead, card));
  }
  const offers = new Map<string, AssetOffer>();
  for (const offer of listPublishedOffers()) {
    offers.set(offer.code, offer);
    items.push(fromAssetOffer(offer));
  }
  const plots = new Map<string, Plot>();
  for (const plot of listPublicPlots()) {
    plots.set(plot.code, plot);
    items.push(fromProspectingPlot(plot));
  }
  const legacy = legacyLeads(leads);

  const shown = filterCatalog(items, filters);
  const counts = facetCounts(items, filters);
  const active = activeFilterCount(filters);
  const kinds = CATALOG_KINDS.filter((k) => items.some((i) => i.kind === k));
  const sorts: CatalogSort[] = ['newest'];
  if (items.some((i) => i.areaHa != null)) sorts.push('area_desc');
  if (items.some((i) => i.validUntil)) sorts.push('valid_desc');

  const commodityOptions = options(
    items.flatMap((i) => i.commodities),
    counts.commodities,
    (id) => leadMineralName(id, locale)
  );
  const regionOptions = options(
    items.flatMap((i) => (i.region ? [i.region] : [])),
    counts.regions,
    (id) => regionLabel(id, locale)
  );

  const href = (p: CatalogParams) => `/${locale}/leads${catalogQuery(p)}`;
  const kindHref = (k: CatalogKind | null) =>
    href({ ...filters, kinds: k ? [k] : [] });
  const onlyKind = filters.kinds.length === 1 ? filters.kinds[0] : null;

  // Removable chips for every active value.
  const chips: { label: string; href: string }[] = [
    ...filters.kinds.map((k) => ({
      label: t(`catalog.kinds.${k}`),
      href: href({ ...filters, kinds: filters.kinds.filter((v) => v !== k) }),
    })),
    ...filters.groups.map((g) => ({
      label: t(`catalog.groups.${g}`),
      href: href({ ...filters, groups: filters.groups.filter((v) => v !== g) }),
    })),
    ...filters.commodities.map((c) => ({
      label: leadMineralName(c, locale),
      href: href({
        ...filters,
        commodities: filters.commodities.filter((v) => v !== c),
      }),
    })),
    ...filters.regions.map((r) => ({
      label: regionLabel(r, locale),
      href: href({
        ...filters,
        regions: filters.regions.filter((v) => v !== r),
      }),
    })),
    ...filters.stages.map((s) => ({
      label: t(`catalog.stages.${s}`),
      href: href({ ...filters, stages: filters.stages.filter((v) => v !== s) }),
    })),
    ...(filters.infra
      ? [
          {
            label: t('catalog.infraOption'),
            href: href({ ...filters, infra: false }),
          },
        ]
      : []),
  ];

  const shownFinds = shown.filter((i) => i.kind === 'find');
  const showLegacy = legacy.length > 0 && (active === 0 || onlyKind === 'find');

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('catalog.title'),
    description: t('seo.leads.description'),
    url: localeUrl(locale, '/leads'),
    inLanguage: HREFLANG[locale],
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: shown.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: localeUrl(locale, item.path),
      })),
    },
  };

  const renderItem = (item: CatalogItem) => {
    if (item.kind === 'find') {
      const card = showcases.get(item.code);
      return card ? (
        <ShowcaseCard
          key={item.code}
          showcase={card}
          locale={locale}
          contacts={contacts}
        />
      ) : null;
    }
    if (item.kind === 'asset') {
      const offer = offers.get(item.code);
      return offer ? (
        <OfferCard
          key={item.code}
          offer={offer}
          locale={locale}
          contacts={contacts}
        />
      ) : null;
    }
    if (item.kind === 'prospecting') {
      const plot = plots.get(item.code);
      return plot ? (
        <ProspectingCard
          key={item.code}
          plot={plot}
          locale={locale}
          contacts={contacts}
        />
      ) : null;
    }
    return null;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-brand-bg pt-14 text-brand-ink lg:pt-16">
        <div className="brand-container pb-16 pt-10 lg:pt-16">
          <header className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-muted">
              {t('catalog.eyebrow')}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
              {t('catalog.title')}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-brand-muted">
              {t(
                kinds.includes('prospecting')
                  ? 'catalog.lede'
                  : 'catalog.ledeNoPlots'
              )}
            </p>
          </header>

          <nav
            aria-label={t('listingsFilters.mineral')}
            className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
          >
            {MINERAL_HUBS.map((hub) => (
              <Link
                key={hub.slug}
                className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
                href={`/${locale}/minerals/${hub.slug}`}
              >
                {hubMineralName(hub.slug, locale)}
              </Link>
            ))}
          </nav>

          {kinds.length > 1 && (
            <nav
              aria-label={t('catalog.kindLabel')}
              className="mt-8 flex max-w-full overflow-x-auto border border-brand-line sm:w-max"
            >
              {[null, ...kinds].map((k) => {
                const current =
                  k === null ? filters.kinds.length === 0 : onlyKind === k;
                const n =
                  k === null
                    ? Object.values(counts.kinds).reduce((a, b) => a + b, 0)
                    : (counts.kinds[k] ?? 0);
                return (
                  <Link
                    key={k ?? 'all'}
                    href={kindHref(k)}
                    scroll={false}
                    aria-current={current ? 'page' : undefined}
                    className={`brand-focus inline-flex min-h-12 shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-brand-line px-4 last:border-r-0 ${current ? 'bg-brand-ink text-brand-bg' : ''}`}
                  >
                    {k === null ? t('catalog.all') : t(`catalog.kinds.${k}`)}
                    <span className="text-sm opacity-70">{n}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="mt-8 grid gap-x-10 gap-y-6 lg:grid-cols-[264px_minmax(0,1fr)]">
            <aside>
              <CatalogFilters
                locale={locale}
                params={filters}
                items={items}
                commodities={commodityOptions}
                regions={regionOptions}
                sorts={sorts}
              />
            </aside>

            <section
              aria-label={t('catalog.shown', { count: shown.length })}
              className="min-w-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-brand-line py-3 text-sm text-brand-muted">
                <div className="flex flex-wrap items-center gap-2">
                  {chips.length ? (
                    chips.map((chip) => (
                      <Link
                        key={chip.href + chip.label}
                        href={chip.href}
                        scroll={false}
                        aria-label={t('catalog.removeFilter', {
                          label: chip.label,
                        })}
                        className="brand-focus inline-flex min-h-9 items-center gap-1.5 border border-brand-line bg-brand-surface px-2.5 text-brand-ink"
                      >
                        {chip.label}
                        <X aria-hidden className="size-3.5" />
                      </Link>
                    ))
                  ) : (
                    <span>{t('catalog.noFilters')}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span>{t('catalog.shown', { count: shown.length })}</span>
                  <SortSelect locale={locale} params={filters} sorts={sorts} />
                </div>
              </div>

              {onlyKind === 'find' && shownFinds.length > 0 && (
                <figure className="m-0 border-b border-brand-line py-6">
                  <ZoneMap
                    zones={shownFinds.map((i) => showcases.get(i.code)!.zone)}
                    label={t('showcase.overviewLabel')}
                    className="mx-auto max-w-4xl"
                  />
                  <figcaption className="mt-3 text-sm text-brand-muted">
                    {t('showcase.overviewCaption')}
                    <span className="mt-1 block text-xs">
                      {t('showcase.mapCredit')}
                    </span>
                  </figcaption>
                </figure>
              )}

              {shown.length === 0 && !showLegacy ? (
                <div className="mt-6 border border-brand-line bg-brand-surface px-6 py-14 text-center">
                  <FileSearch
                    aria-hidden
                    className="mx-auto size-9 text-brand-muted"
                  />
                  <h2 className="mt-4 font-serif text-2xl">
                    {t('catalog.emptyTitle')}
                  </h2>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      href={`/${locale}/leads`}
                      className="brand-button-secondary brand-focus min-h-12"
                    >
                      {t('catalog.reset')}
                    </Link>
                    <Link
                      href={`/${locale}/contact`}
                      className="brand-button brand-focus min-h-12"
                    >
                      {t('leadsCatalog.emptyCta')}
                      <ArrowUpRight aria-hidden className="size-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div>{shown.map(renderItem)}</div>
              )}

              {showLegacy && (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {legacy.map((lead) => (
                    <LeadCard key={lead.code} lead={lead} locale={locale} />
                  ))}
                </div>
              )}

              {shownFinds.length > 0 && <ShowcaseDisclaimer locale={locale} />}
            </section>
          </div>
        </div>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
