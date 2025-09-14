'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ListingsFilters from '@/components/features/ListingsFilters';
import ListingCard from '@/components/cards/ListingCard';
import DepositMap from '@/components/features/DepositMap';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { LiveActivityIndicator } from '@/components/features/SocialProof';
import { depositApi } from '@/lib/api/deposits';
import { List, Map } from 'lucide-react';
import type {
  KazakhstanDeposit,
  SearchParams,
  ListingFilters,
  RegionType,
  MineralType,
  ListingType,
} from '@/lib/types/listing';

function ListingsContent() {
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

  // Пагинация
  const itemsPerPage = 12;
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Создаем строку запроса с учетом существующих параметров
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

  // Функция для загрузки данных из API
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
      console.error('Error loading deposits:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage]);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const _handleFilterChange = (key: string, value: string | boolean) => {
    const stringValue =
      typeof value === 'boolean' ? (value ? 'true' : '') : value;
    const queryString = createQueryString(
      key === 'query' ? 'q' : key,
      stringValue
    );
    router.push(`${pathname}?${queryString}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Месторождения полезных ископаемых
              </h1>
              <p className="text-gray-600">
                {loading
                  ? 'Загрузка...'
                  : `Найдено ${totalCount} месторождений`}
              </p>
            </div>
            <Link
              href="/listings/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 hover:shadow-md transition-all"
            >
              + Создать объявление
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content with Filters and Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ListingsFilters />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Count and View Options */}
            {!loading && !error && (
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-900 font-medium">
                    {totalCount} месторождений
                  </p>
                  <p className="text-sm text-gray-600">
                    Показано {deposits.length} результатов
                    {currentPage > 1 &&
                      ` (страница ${currentPage} из ${totalPages})`}
                  </p>
                </div>

                {/* View Toggle */}
                <div className="relative flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <List className="w-4 h-4" />
                    Список
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('map')}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      viewMode === 'map'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Map className="w-4 h-4" />
                    Карта
                  </motion.button>

                  {/* Animated background slider */}
                  <motion.div
                    className="absolute top-1 h-8 bg-white shadow-sm rounded-md"
                    animate={{
                      x: viewMode === 'list' ? 4 : '100%',
                      width: viewMode === 'list' ? 78 : 70,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    style={{ left: 0 }}
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <SkeletonCard />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ошибка загрузки
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadDeposits}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            )}

            {/* Content based on view mode */}
            {!loading && !error && (
              <>
                {viewMode === 'list' ? (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {deposits.map((deposit, index) => (
                      <motion.div
                        key={deposit.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <ListingCard deposit={deposit} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="mb-8">
                    <DepositMap
                      deposits={deposits}
                      selectedDeposit={selectedDeposit}
                      onDepositClick={setSelectedDeposit}
                      height="600px"
                      className="rounded-lg shadow-sm border border-gray-200"
                    />

                    {/* Selected Deposit Card */}
                    {selectedDeposit && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Выбранное месторождение
                          </h3>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="max-w-md">
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
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Месторождения не найдены
                </h3>
                <p className="text-gray-600">
                  Попробуйте изменить параметры фильтра
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            {/* Previous Button */}
            <button
              onClick={() =>
                currentPage > 1 &&
                router.push(
                  `${pathname}?${createQueryString('page', (currentPage - 1).toString())}`
                )
              }
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← Назад
            </button>

            {/* Page Numbers */}
            <div className="flex space-x-2">
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
                  <button
                    key={pageNum}
                    onClick={() =>
                      router.push(
                        `${pathname}?${createQueryString('page', pageNum.toString())}`
                      )
                    }
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() =>
                currentPage < totalPages &&
                router.push(
                  `${pathname}?${createQueryString('page', (currentPage + 1).toString())}`
                )
              }
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage >= totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Далее →
            </button>
          </div>
        )}
      </div>

      {/* Live Activity Indicator */}
      <LiveActivityIndicator />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Загрузка...</div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
