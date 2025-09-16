'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ListingCard from '@/components/cards/ListingCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { depositApi } from '@/lib/api/deposits';
import type { KazakhstanDeposit, SearchParams } from '@/lib/types/listing';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface InfiniteListingsProps {
  filters?: SearchParams['filters'];
  sortBy?: SearchParams['sortBy'];
  sortOrder?: SearchParams['sortOrder'];
  query?: string;
}

export default function InfiniteListings({
  filters,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  query,
}: InfiniteListingsProps) {
  const [totalLoaded, setTotalLoaded] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['listings', filters, sortBy, sortOrder, query],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await depositApi.search({
        page: pageParam,
        limit: 12,
        filters,
        sortBy,
        sortOrder,
        query,
      });
      return result;
    },
    getNextPageParam: (lastPage, pages) => {
      const currentPage = pages.length;
      return currentPage < lastPage.totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (data) {
      const total = data.pages.reduce(
        (acc, page) => acc + page.deposits.length,
        0
      );
      setTotalLoaded(total);
    }
  }, [data]);

  // Loading state for initial load
  if (status === 'pending') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Произошла ошибка при загрузке
        </h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'Не удалось загрузить объявления'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
      </motion.div>
    );
  }

  const allDeposits = data?.pages.flatMap((page) => page.deposits) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Empty state
  if (allDeposits.length === 0 && !isFetching) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Объявления не найдены
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Попробуйте изменить параметры поиска или фильтры для получения
          результатов
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-900 font-medium">
            Найдено {totalCount} месторождений
          </p>
          <p className="text-sm text-gray-600">
            Загружено {totalLoaded} из {totalCount}
          </p>
        </div>
        {isFetching && !isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-sm text-blue-600"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Обновление...</span>
          </motion.div>
        )}
      </div>

      {/* Listings grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        <AnimatePresence mode="popLayout">
          {allDeposits.map((deposit, index) => (
            <motion.div
              key={deposit.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
            >
              <ListingCard deposit={deposit} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load more trigger */}
      <div ref={ref} className="mt-8 flex justify-center">
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Загрузка объявлений...</p>
          </motion.div>
        )}

        {!hasNextPage && allDeposits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">
              Все {totalCount} объявлений загружены
            </p>
          </motion.div>
        )}
      </div>

      {/* Loading skeleton for smooth experience */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}
