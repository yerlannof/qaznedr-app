'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import ListingsFilters from '@/components/features/ListingsFilters';
import ListingCard from '@/components/cards/ListingCard';
import { depositApi } from '@/lib/api/deposits';
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ListingsFilters />

        {/* Результаты и сортировка */}
        {!loading && !error && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-600">
                Показано {deposits.length} из {totalCount} месторождений
                {currentPage > 1 &&
                  ` (страница ${currentPage} из ${totalPages})`}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
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

        {/* Listings Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deposits.map((deposit) => (
              <ListingCard key={deposit.id} deposit={deposit} />
            ))}
          </div>
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
