import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { emailDeliveryConfigured } from '@/lib/email/resend';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import EquipmentCatalog from '@/components/equipment/catalog/EquipmentCatalog';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';
import {
  coverImagesFor,
  searchEquipmentCatalog,
} from '@/lib/equipment-listings/catalog-repository';
import { trustMarksFor } from '@/lib/equipment-listings/moderation-repository';
import {
  isIndexableQuery,
  parseCatalogQuery,
} from '@/lib/equipment-listings/catalog-query';
import { intakeLabel } from '@/lib/equipment-listings/present';

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

export default async function EquipmentCatalogPage({
  params,
  searchParams,
}: Props) {
  if (!enabled()) notFound();
  const locale = toLocale((await params).locale);
  const { query } = parseCatalogQuery(await searchParams);
  let result = null;
  let covers: Record<string, string> = {};
  let marks: Record<string, string[]> = {};
  try {
    result = await searchEquipmentCatalog(query);
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
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <EquipmentCatalog
          locale={locale}
          filters={{
            offerType: query.offerType,
            category: query.category,
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
          subscribeEnabled={emailDeliveryConfigured()}
        />
      </main>
      <Footer />
    </>
  );
}
