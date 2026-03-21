'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ListingsFilters from '@/components/features/ListingsFilters';
import ListingCard from '@/components/cards/ListingCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Button } from '@/components/ui/button';

// Dynamic import for heavy map component
const DepositMap = dynamic(
  () =>
    import('@/components/features/DepositMap').then((mod) => ({
      default: mod.DepositMap,
    })),
  {
    loading: () => (
      <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading map...</span>
      </div>
    ),
    ssr: false,
  }
);
import { depositApi } from '@/lib/api/deposits';
import { useTranslation } from '@/hooks/useTranslation';
import {
  List,
  Map,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type {
  KazakhstanDeposit,
  SearchParams,
  ListingFilters,
  RegionType,
  MineralType,
  ListingType,
} from '@/lib/types/listing';

function ListingsContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [deposits, setDeposits] = useState<KazakhstanDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedDeposit, setSelectedDeposit] =
    useState<KazakhstanDeposit | null>(null);

  const [_filters, _setFilters] = useState<ListingFilters>({
    region: [],
    mineral: [],
    type: [],
    verified: undefined,
    featured: undefined,
  });

  const itemsPerPage = 12;
  const currentPage = parseInt(searchParams.get('page') || '1');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchQuery: SearchParams = {
        page: currentPage,
        limit: itemsPerPage,
        query: searchParams.get('q') || undefined,
        sortBy:
          (searchParams.get('sortBy') as
            | 'price'
            | 'area'
            | 'views'
            | 'createdAt') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        filters: {
          region: searchParams.get('region')
            ? [searchParams.get('region')! as RegionType]
            : undefined,
          mineral: searchParams.get('mineral')
            ? [searchParams.get('mineral')! as MineralType]
            : undefined,
          type: searchParams.get('type')
            ? [searchParams.get('type')! as ListingType]
            : undefined,
          verified: searchParams.get('verified') === 'true' ? true : undefined,
          featured: searchParams.get('featured') === 'true' ? true : undefined,
          priceMin: searchParams.get('priceMin')
            ? Number(searchParams.get('priceMin')) * 1000000000
            : undefined,
          priceMax: searchParams.get('priceMax')
            ? Number(searchParams.get('priceMax')) * 1000000000
            : undefined,
        },
      };

      const result = await depositApi.search(searchQuery);

      setDeposits(result.deposits);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Произошла ошибка при загрузке данных'
      );
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Месторождения и лицензии Казахстана',
    description:
      'Каталог горнодобывающих лицензий, участков разведки и минеральных проявлений',
    url: 'https://qaznedr.kz/ru/listings',
    numberOfItems: totalCount || 0,
    itemListOrder: 'https://schema.org/ItemListUnordered',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd),
        }}
      />
      <Navigation />

      {/* Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                {t('listings.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {loading
                  ? t('listings.loading')
                  : `${totalCount} ${t('listings.foundDeposits', { count: totalCount })}`}
              </p>
            </div>
            <Button asChild variant="accent">
              <Link href={`/${locale}/listings/create`}>
                + {t('navigation.createListing')}
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
            {/* Results Count and View Options */}
            {!loading && !error && (
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  {t('listings.showingResults', { count: deposits.length })}
                  {currentPage > 1 &&
                    ` (${t('listings.pageInfo', { current: currentPage, total: totalPages })})`}
                </p>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    {t('listings.viewMode.list')}
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      viewMode === 'map'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    {t('listings.viewMode.map')}
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-16">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-4">
                  Ошибка загрузки
                </h3>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <Button
                  className="mt-4"
                  variant="accent"
                  onClick={loadDeposits}
                >
                  Попробовать снова
                </Button>
              </div>
            )}

            {/* Content based on view mode */}
            {!loading && !error && deposits.length > 0 && (
              <>
                {viewMode === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deposits.map((deposit) => (
                      <ListingCard key={deposit.id} deposit={deposit} />
                    ))}
                  </div>
                ) : (
                  <div className="mb-8">
                    <DepositMap
                      deposits={deposits}
                      selectedDeposit={selectedDeposit}
                      onDepositClick={setSelectedDeposit}
                      height="600px"
                      className="rounded-xl border border-gray-200 dark:border-gray-700"
                    />

                    {/* Selected Deposit Card */}
                    {selectedDeposit && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                            Выбранное месторождение
                          </h3>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-w-sm">
                          <ListingCard deposit={selectedDeposit} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && !error && deposits.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-4">
                  Ничего не найдено
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Попробуйте изменить фильтры
                </p>
                <Button className="mt-4" onClick={clearAllFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                currentPage > 1 &&
                router.push(
                  `${pathname}?${createQueryString('page', (currentPage - 1).toString())}`
                )
              }
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() =>
                      router.push(
                        `${pathname}?${createQueryString('page', pageNum.toString())}`
                      )
                    }
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                currentPage < totalPages &&
                router.push(
                  `${pathname}?${createQueryString('page', (currentPage + 1).toString())}`
                )
              }
              disabled={currentPage >= totalPages}
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-sm text-gray-400">Загрузка...</div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
