import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { emailDeliveryConfigured } from '@/lib/email/resend';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHero from '@/components/home/PageHero';
import EquipmentCatalog, {
  type CatalogCounts,
} from '@/components/equipment/catalog/EquipmentCatalog';
import { SCENES } from '@/lib/brand/photos';
import { getContactConfig } from '@/lib/config/contacts';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';
import {
  catalogFacets,
  coverImagesFor,
  searchEquipmentCatalog,
  type CatalogFacet,
} from '@/lib/equipment-listings/catalog-repository';
import { trustMarksFor } from '@/lib/equipment-listings/moderation-repository';
import {
  isIndexableQuery,
  parseCatalogGroup,
  parseCatalogQuery,
} from '@/lib/equipment-listings/catalog-query';
import { intakeLabel } from '@/lib/equipment-listings/present';
import type { EquipmentSearchQuery } from '@/lib/equipment-listings/search';
import {
  CATEGORY_GROUPS,
  OFFER_TYPES,
  groupOf,
  type CategoryGroup,
} from '@/lib/equipment-listings/taxonomy';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const enabled = equipmentCatalogEnabled;

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const { query, adjusted } = parseCatalogQuery(await searchParams);
  const scope = [
    query.category ? intakeLabel(locale, query.category) : null,
    query.region ? regionLabel(query.region, locale) : null,
  ].filter(Boolean);
  const title = translate(locale, 'equipmentCatalog.metaTitle');
  const path =
    '/equipment' +
    (scope.length
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(
            [
              ['category', query.category],
              ['region', query.region],
            ].filter(([, value]) => value) as [string, string][]
          )
        ).toString()
      : '');
  return buildPageMetadata({
    locale,
    path,
    title: scope.length ? `${scope.join(', ')} — ${title}` : title,
    description: translate(locale, 'equipmentCatalog.metaDescription'),
    noindex: !enabled() || adjusted || !isIndexableQuery(query),
  });
}

/**
 * A section tile covers several categories; the search function takes one,
 * so each is searched and the pages merged here. Each part is capped at 50,
 * which is ample for the pilot catalogue.
 */
async function searchGroup(query: EquipmentSearchQuery, group: CategoryGroup) {
  const parts = await Promise.all(
    CATEGORY_GROUPS[group].map((category) =>
      searchEquipmentCatalog({ ...query, category, page: 1, limit: 50 })
    )
  );
  const items = parts
    .flatMap((part) => part.items)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit),
    total: parts.reduce((sum, part) => sum + part.total, 0),
    limit: query.limit,
  };
}

function countFacets(
  facets: CatalogFacet[],
  query: EquipmentSearchQuery,
  group: CategoryGroup | null
): CatalogCounts {
  const inRegion = facets.filter(
    (row) => !query.region || row.region === query.region
  );
  const groups = Object.fromEntries(
    (Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map((item) => [
      item,
      inRegion.filter((row) => groupOf(row.category) === item).length,
    ])
  ) as CatalogCounts['groups'];
  const inSection = inRegion.filter((row) =>
    query.category
      ? row.category === query.category
      : !group || groupOf(row.category) === group
  );
  const offers = Object.fromEntries([
    ['all', inSection.length],
    ...OFFER_TYPES.map((type) => [
      type,
      inSection.filter((row) => row.offerType === type).length,
    ]),
  ]) as CatalogCounts['offers'];
  return { groups, offers, total: facets.length };
}

export default async function EquipmentCatalogPage({
  params,
  searchParams,
}: Props) {
  if (!enabled()) notFound();
  const locale = toLocale((await params).locale);
  const raw = await searchParams;
  const { query } = parseCatalogQuery(raw);
  const group = parseCatalogGroup(raw, query);
  let result = null;
  let counts: CatalogCounts | null = null;
  let covers: Record<string, string> = {};
  let marks: Record<string, string[]> = {};
  try {
    const [found, facets] = await Promise.all([
      group ? searchGroup(query, group) : searchEquipmentCatalog(query),
      catalogFacets().catch(() => null),
    ]);
    result = found;
    counts = facets ? countFacets(facets, query, group) : null;
    const ids = result.items.map((item) => item.id);
    const [coverMap, markMap] = await Promise.all([
      coverImagesFor(ids),
      trustMarksFor(ids).catch(() => ({})),
    ]);
    covers = coverMap;
    marks = Object.fromEntries(
      Object.entries(markMap).map(([id, rows]) => [
        id,
        rows.map((row) => row.mark),
      ])
    );
  } catch {
    result = null;
  }
  const t = (key: string) => translate(locale, `equipmentCatalog.${key}`);
  return (
    <>
      <Navigation overlay />
      <PageHero
        locale={locale}
        compact
        src={SCENES.machinery}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lede={t('intro')}
        label={translate(locale, 'homeV2.illustration')}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/equipment/new`}
            className="brand-button brand-focus"
          >
            <Plus aria-hidden className="size-[18px]" strokeWidth={1.6} />
            {t('tabSubmit')}
          </Link>
          <Link
            href={`/${locale}/equipment/my`}
            className="brand-button-secondary brand-focus"
          >
            {translate(locale, 'equipmentCabinet.tab')}
          </Link>
        </div>
      </PageHero>
      <main className="bg-brand-bg text-brand-ink">
        <EquipmentCatalog
          locale={locale}
          filters={{
            offerType: query.offerType,
            category: query.category,
            group,
            region: query.region,
            kind: query.kind,
            serviceMethod: query.serviceMethod,
            accredited: query.accredited,
            page: query.page,
          }}
          result={
            result
              ? {
                  items: result.items,
                  total: result.total,
                  limit: result.limit,
                }
              : null
          }
          covers={covers}
          marks={marks}
          counts={counts}
          subscribeEnabled={emailDeliveryConfigured()}
          whatsappNumber={getContactConfig().whatsappNumber}
        />
      </main>
      <Footer />
    </>
  );
}
