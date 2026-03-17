'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, FileText, Eye, MapPin, Calendar } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  type: string;
  mineral: string;
  region: string;
  city: string;
  status: string;
  createdAt: string;
  views: number;
  price: number | null;
  area: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING_MODERATION: {
    label: 'На проверке',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  ACTIVE: {
    label: 'Опубликовано',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  REJECTED: {
    label: 'Отклонено',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  DRAFT: {
    label: 'Черновик',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
};

const TYPE_LABELS: Record<string, string> = {
  MINING_LICENSE: 'Лицензия на добычу',
  EXPLORATION_LICENSE: 'Лицензия на разведку',
  MINERAL_OCCURRENCE: 'Рудопроявление',
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || STATUS_BADGES.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const { data: session, status: authStatus } = useSession();
  const { locale } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/my-listings?page=${page}&limit=10`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('Необходима авторизация');
          return;
        }
        throw new Error('Ошибка загрузки');
      }
      const json = await res.json();
      if (json.success) {
        setListings(json.data.deposits);
        setPagination(json.data.pagination);
      } else {
        throw new Error(json.error || 'Ошибка загрузки');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Произошла ошибка при загрузке'
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (session) {
      fetchListings();
    }
  }, [session, fetchListings]);

  // Loading auth
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationSimple />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationSimple />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Необходима авторизация
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Войдите, чтобы управлять своими объявлениями.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationSimple />

      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Мои объявления
            </h1>
            <Link
              href={`/${locale}/listings/create`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать объявление
            </Link>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchListings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && listings.length === 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                У вас пока нет объявлений
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Создайте первое объявление о продаже месторождения или лицензии
              </p>
              <Link
                href={`/${locale}/listings/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Создать объявление
              </Link>
            </div>
          )}

          {/* Listings list */}
          {!loading && !error && listings.length > 0 && (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/${locale}/listings/${listing.id}`}
                  className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {listing.title}
                        </h3>
                        <StatusBadge status={listing.status} />
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {TYPE_LABELS[listing.type] || listing.type}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.region}
                        </span>
                        <span>{listing.mineral}</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {listing.views}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(listing.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pagination.hasPrev
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Назад
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={!pagination.hasNext}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pagination.hasNext
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Далее
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
