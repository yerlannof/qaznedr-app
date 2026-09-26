import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadCard from '@/components/cards/LeadCard';
import { Search, ShieldCheck, FileSearch, Mail } from 'lucide-react';
import {
  listPublishedLeads,
  listLeadRegions,
  type LeadListFilters,
} from '@/lib/leads/public-queries';
import { regionLabel } from '@/lib/data/filter-config';
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
  const { locale } = await params;
  const sp = await searchParams;
  const { t } = getServerTranslation(locale);

  const filters: LeadListFilters = {
    region: str(sp.region),
    tier: str(sp.tier),
    freeOnly: str(sp.free) === '1',
    sort: (str(sp.sort) as LeadListFilters['sort']) ?? 'newest',
    page: Number(str(sp.page) ?? '1') || 1,
    limit: 24,
  };

  const [{ leads, total, page, totalPages }, regions] = await Promise.all([
    listPublishedLeads(filters),
    listLeadRegions(),
  ]);

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = {
      region: filters.region,
      tier: filters.tier,
      free: filters.freeOnly ? '1' : undefined,
      sort: filters.sort,
      ...overrides,
    } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return `/${locale}/leads${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(200,162,75,0.12)] text-gold-dark dark:text-gold-light text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {t('leadsCatalog.eyebrow')}
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50">
            {t('leadsCatalog.title')}
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('leadsCatalog.valueProp1')}
          </p>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('leadsCatalog.valueProp2')}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
            {t('leadsCatalog.foundCount', { count: total })}
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters (server GET form — works without JS, SEO-friendly) */}
          <aside className="lg:col-span-1">
            <form
              method="get"
              action={`/${locale}/leads`}
              className="lg:sticky lg:top-24 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-[#141414]"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Search className="w-4 h-4" aria-hidden="true" />{' '}
                {t('leadsCatalog.filters')}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('leadsCatalog.region')}
                </label>
                <select
                  name="region"
                  defaultValue={filters.region ?? ''}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">{t('leadsCatalog.allRegions')}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {regionLabel(r, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('leadsCatalog.type')}
                </label>
                <select
                  name="tier"
                  defaultValue={filters.tier ?? ''}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">{t('leadsCatalog.allTypes')}</option>
                  <option value="TIER1_PLACER">
                    {t('leadsCatalog.typePlacer')}
                  </option>
                  <option value="TIER2_BOMB">
                    {t('leadsCatalog.typeInvest')}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('leadsCatalog.sort')}
                </label>
                <select
                  name="sort"
                  defaultValue={filters.sort ?? 'newest'}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="newest">{t('leadsCatalog.sortNewest')}</option>
                  <option value="value_desc">
                    {t('leadsCatalog.sortValueDesc')}
                  </option>
                  <option value="confidence_desc">
                    {t('leadsCatalog.sortConfidenceDesc')}
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="free"
                  value="1"
                  defaultChecked={filters.freeOnly}
                  className="rounded border-gray-300"
                />
                {t('leadsCatalog.freeOnly')}
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  {t('leadsCatalog.apply')}
                </button>
                <Link
                  href={`/${locale}/leads`}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('leadsCatalog.reset')}
                </Link>
              </div>
            </form>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {leads.length === 0 ? (
              <div className="text-center py-20 px-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <FileSearch
                  className="w-10 h-10 mx-auto text-gray-300"
                  aria-hidden="true"
                />
                <p className="mt-4 font-serif text-xl text-gray-900 dark:text-gray-100">
                  {t('leadsCatalog.emptyTitle')}
                </p>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  {t('leadsCatalog.emptyDesc')}
                </p>
                <Link
                  href={`/${locale}/contact`}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  {t('leadsCatalog.emptyCta')}
                </Link>
                <Link
                  href={`/${locale}/leads`}
                  className="mt-4 block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {t('leadsCatalog.resetFilters')}
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {leads.map((lead) => (
                    <LeadCard key={lead.code} lead={lead} locale={locale} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {page > 1 && (
                      <Link
                        href={buildQuery({ page: String(page - 1) })}
                        className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {t('leadsCatalog.back')}
                      </Link>
                    )}
                    <span className="px-3 text-sm text-gray-500">
                      {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={buildQuery({ page: String(page + 1) })}
                        className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {t('leadsCatalog.forward')}
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
