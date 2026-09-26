import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ListingsFilters from '@/components/features/ListingsFilters';
import ListingsResults from '@/components/features/ListingsResults';
import { Button, buttonVariants } from '@/components/ui/button';
import { Search, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { getListings } from '@/lib/listings/queries';
import { getServerTranslation } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 12;

function firstString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const { t } = getServerTranslation(locale);

  const currentPage = Math.max(1, parseInt(firstString(sp.page) || '1') || 1);

  const { deposits, total, totalPages } = await getListings(
    sp,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Build a pagination href that preserves the active filters.
  const buildPageHref = (pageNum: number) => {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === 'page') continue;
      const v = firstString(value);
      if (v) q.set(key, v);
    }
    q.set('page', String(pageNum));
    return `/${locale}/listings?${q.toString()}`;
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Месторождения и лицензии Казахстана',
    description:
      'Каталог лицензий на добычу, участков разведки и минеральных проявлений',
    url: 'https://qaznedr.kz/ru/listings',
    numberOfItems: total || 0,
    itemListOrder: 'https://schema.org/ItemListUnordered',
  };

  // Window of page numbers, matching the previous client pagination logic.
  const pageWindow: number[] = Array.from(
    { length: Math.min(5, Math.max(totalPages, 0)) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    }
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />

      {/* Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[rgba(200,162,75,0.12)] text-gold-dark dark:text-gold-light text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('navigation.listings')}
              </div>
              <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50">
                {t('listings.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {`${total} ${t('listings.foundDeposits', { count: total })}`}
              </p>
            </div>
            <Button asChild variant="outline" className="hidden lg:inline-flex">
              <Link href={`/${locale}/listings/create`}>
                {t('navigation.createListing')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Filters and Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ListingsFilters />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {deposits.length > 0 ? (
              <ListingsResults
                deposits={deposits}
                locale={locale}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            ) : (
              /* No Results */
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-4">
                  {t('listings.noResultsTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('listings.noResultsDesc')}
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/${locale}/listings`}>
                    {t('listings.resetFilters')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <ChevronLeft className="w-4 h-4" />
                {t('listings.back')}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'pointer-events-none opacity-50'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                {t('listings.back')}
              </span>
            )}

            <div className="flex gap-1">
              {pageWindow.map((pageNum) =>
                currentPage === pageNum ? (
                  <span
                    key={pageNum}
                    aria-current="page"
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'sm' }),
                      'w-9'
                    )}
                  >
                    {pageNum}
                  </span>
                ) : (
                  <Link
                    key={pageNum}
                    href={buildPageHref(pageNum)}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'w-9'
                    )}
                  >
                    {pageNum}
                  </Link>
                )
              )}
            </div>

            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('listings.next')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'pointer-events-none opacity-50'
                )}
              >
                {t('listings.next')}
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
