'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import { depositApi } from '@/lib/api/deposits';
import type { KazakhstanDeposit } from '@/lib/types/listing';

export default function MyListingsPage() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<KazakhstanDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'pending' | 'sold'
  >('all');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Загрузка объявлений пользователя
  const loadMyListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab === 'all' ? undefined : activeTab.toUpperCase(),
      };

      const result = await depositApi.getMyListings(params);

      setListings(result.deposits);
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
  }, [activeTab, currentPage]);

  // Загрузка объявлений пользователя при изменении зависимостей
  useEffect(() => {
    if (session) {
      loadMyListings();
    }
  }, [session, loadMyListings]);

  // Проверка авторизации
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationSimple />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationSimple />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Необходима авторизация
            </h1>
            <p className="text-gray-600 mb-6">
              Войдите в систему, чтобы управлять своими объявлениями.
            </p>
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) {
      return;
    }

    try {
      await depositApi.delete(listingId);
      await loadMyListings(); // Перезагрузка списка
      alert('Объявление успешно удалено');
    } catch (err) {
      alert('Произошла ошибка при удалении объявления');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            Активно
          </span>
        );
      case 'PENDING':
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            На модерации
          </span>
        );
      case 'SOLD':
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
            Продано
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getMineralIcon = (mineral: string) => {
    switch (mineral) {
      case 'Нефть':
        return '🛢️';
      case 'Газ':
        return '⛽';
      case 'Золото':
        return '🥇';
      case 'Медь':
        return '🔶';
      case 'Уголь':
        return '⚫';
      case 'Уран':
        return '☢️';
      case 'Железо':
        return '🔩';
      default:
        return '⛏️';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';

    if (price >= 1000000000000) {
      return `${(price / 1000000000000).toFixed(1)} трлн ₸`;
    } else if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} млрд ₸`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн ₸`;
    } else {
      return `${price.toLocaleString()} ₸`;
    }
  };

  const tabs = [
    { key: 'all', label: 'Все', count: totalCount },
    {
      key: 'active',
      label: 'Активные',
      count: listings.filter((l) => l.status === 'ACTIVE').length,
    },
    {
      key: 'pending',
      label: 'На модерации',
      count: listings.filter((l) => l.status === 'PENDING').length,
    },
    {
      key: 'sold',
      label: 'Проданные',
      count: listings.filter((l) => l.status === 'SOLD').length,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Мои объявления
              </h1>
              <p className="text-gray-600">
                Управляйте своими объявлениями о продаже месторождений
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(
                    tab.key as 'all' | 'active' | 'pending' | 'sold'
                  );
                  setCurrentPage(1);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
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
              onClick={loadMyListings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {activeTab === 'all'
                ? 'У вас пока нет объявлений'
                : `Нет объявлений со статусом "${tabs.find((t) => t.key === activeTab)?.label}"`}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {activeTab === 'all'
                ? 'Создайте свое первое объявление о продаже месторождения'
                : 'Попробуйте выбрать другую категорию или создать новое объявление'}
            </p>
            <Link
              href="/listings/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Создать объявление
            </Link>
          </div>
        )}

        {/* Listings */}
        {!loading && !error && listings.length > 0 && (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">
                        {getMineralIcon(listing.mineral)}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {listing.region}, {listing.city} •{' '}
                          {listing.area.toLocaleString()} км²
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      {getStatusBadge(listing.status)}
                      {listing.verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          ✓ Проверено
                        </span>
                      )}
                      {listing.featured && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Рекомендуем
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span>Просмотры: {listing.views}</span>
                        <span>
                          Создано:{' '}
                          {listing.createdAt.toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(listing.price)}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      Просмотр
                    </Link>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← Назад
            </button>

            <span className="text-gray-600">
              Страница {currentPage} из {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
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
