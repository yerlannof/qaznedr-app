import Link from 'next/link';
import { ArrowUpRight, FileSearch } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadCard from '@/components/cards/LeadCard';
import LeadFilters from '@/components/features/LeadFilters';
import ShowcaseList, { legacyLeads } from '@/components/showcase/ShowcaseList';
import { getContactConfig } from '@/lib/config/contacts';
import {
  listPublishedLeads,
  listLeadRegions,
  type LeadListFilters,
} from '@/lib/leads/public-queries';
import { MINERAL_HUBS, hubMineralName } from '@/lib/leads/minerals';
import { HREFLANG, localeUrl, toLocale } from '@/lib/seo/site';
import type { LeadType } from '@/lib/leads/types';
import { getServerTranslation } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LeadsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = toLocale((await params).locale);
  const sp = await searchParams;
  const { t } = getServerTranslation(locale);
  const rawType = str(sp.type);
  const rawSort = str(sp.sort);
  const rawPage = Number(str(sp.page));
  const filters: LeadListFilters = {
    mineral: str(sp.mineral),
    region: str(sp.region),
    type: (['placer', 'bedrock', 'other'].includes(rawType ?? '')
      ? rawType
      : undefined) as LeadType | undefined,
    tier: str(sp.tier),
    freeOnly: str(sp.free) === '1',
    sort: (['newest', 'value_desc', 'confidence_desc'].includes(rawSort ?? '')
      ? rawSort
      : 'newest') as LeadListFilters['sort'],
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    limit: 24,
  };

  const [{ leads, total, page, totalPages }, regions] = await Promise.all([
    listPublishedLeads(filters),
    listLeadRegions(),
  ]);
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('navigation.leads'),
    description: t('leadsCatalog.valueProp2'),
    url: localeUrl(locale, '/leads'),
    inLanguage: HREFLANG[locale],
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: leads.map((lead, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: localeUrl(locale, `/leads/${lead.code}`),
      })),
    },
  };

  const buildQuery = (nextPage: number) => {
    const q = new URLSearchParams();
    if (filters.mineral) q.set('mineral', filters.mineral);
    if (filters.region) q.set('region', filters.region);
    if (filters.type) q.set('type', filters.type);
    if (filters.tier) q.set('tier', filters.tier);
    if (filters.freeOnly) q.set('free', '1');
    if (filters.sort) q.set('sort', filters.sort);
    q.set('page', String(nextPage));
    return `/${locale}/leads?${q.toString()}`;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-brand-bg pt-14 text-brand-ink lg:pt-16">
        <div className="brand-container pb-16 pt-10 lg:pt-16">
          <header className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-muted">
              {t('leadsCatalog.eyebrow')}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
              {t('navigation.leads')}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-brand-muted">
              {t('leadsCatalog.valueProp2')}
            </p>
          </header>

          <nav
            aria-label={t('listingsFilters.mineral')}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          >
            {MINERAL_HUBS.map((hub) => (
              <Link
                key={hub.slug}
                className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
                href={`/${locale}/minerals/${hub.slug}`}
              >
                {hubMineralName(hub.slug, toLocale(locale))}
              </Link>
            ))}
          </nav>
          <div className="mt-10">
            <LeadFilters locale={locale} filters={filters} regions={regions} />
          </div>

          <section
            aria-label={t('leadsCatalog.foundCount', { count: total })}
            className="pt-8"
          >
            <p className="mb-5 text-sm text-brand-muted">
              {t('leadsCatalog.foundCount', { count: total })}
            </p>
            {leads.length === 0 ? (
              <div className="border border-brand-line bg-brand-surface px-6 py-14 text-center">
                <FileSearch
                  aria-hidden="true"
                  className="mx-auto size-9 text-brand-muted"
                />
                <h2 className="mt-4 font-serif text-2xl">
                  {t('leadsCatalog.emptyTitle')}
                </h2>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/${locale}/leads`}
                    className="brand-button-secondary brand-focus min-h-12"
                  >
                    {t('leadsCatalog.resetFilters')}
                  </Link>
                  <Link
                    href={`/${locale}/contact`}
                    className="brand-button brand-focus min-h-12"
                  >
                    {t('leadsCatalog.emptyCta')}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <ShowcaseList
                  leads={leads}
                  locale={locale}
                  contacts={getContactConfig()}
                />
                {legacyLeads(leads).length > 0 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {legacyLeads(leads).map((lead) => (
                      <LeadCard key={lead.code} lead={lead} locale={locale} />
                    ))}
                  </div>
                )}
                {totalPages > 1 && (
                  <nav
                    aria-label={t('leadsCatalog.foundCount', { count: total })}
                    className="mt-10 flex items-center justify-center gap-3"
                  >
                    {page > 1 && (
                      <Link
                        href={buildQuery(page - 1)}
                        className="brand-button-secondary brand-focus min-h-11 text-sm"
                      >
                        {t('leadsCatalog.back')}
                      </Link>
                    )}
                    <span className="px-2 text-sm text-brand-muted">
                      {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={buildQuery(page + 1)}
                        className="brand-button-secondary brand-focus min-h-11 text-sm"
                      >
                        {t('leadsCatalog.forward')}
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </section>
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
