'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import MiningLicenseDetails from '@/components/detail-sections/MiningLicenseDetails';
import ExplorationLicenseDetails from '@/components/detail-sections/ExplorationLicenseDetails';
import MineralOccurrenceDetails from '@/components/detail-sections/MineralOccurrenceDetails';
import ContactReveal from '@/components/features/ContactReveal';
import MessagingSystem from '@/components/features/MessagingSystem';
import { Badge } from '@/components/ui/badge';
import { depositApi } from '@/lib/api/deposits';
import { favoritesApi } from '@/lib/api/favorites';
import type { KazakhstanDeposit } from '@/lib/types/listing';
import {
  Bookmark,
  Heart,
  MapPin,
  FileText,
  AlertTriangle,
  MessageSquare,
  Share2,
  X,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function getTypeLabel(type: string) {
  switch (type) {
    case 'MINING_LICENSE':
      return 'Лицензия на добычу';
    case 'EXPLORATION_LICENSE':
      return 'Лицензия на разведку';
    case 'MINERAL_OCCURRENCE':
      return 'Рудопроявление';
    default:
      return type;
  }
}

function getStatusVariant(
  status: string
): 'default' | 'blue' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'ACTIVE':
      return 'blue';
    case 'PENDING':
      return 'default';
    case 'SOLD':
      return 'default';
    default:
      return 'default';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Активно';
    case 'PENDING':
      return 'В ожидании';
    case 'SOLD':
      return 'Продано';
    default:
      return status;
  }
}

export default function DepositDetailPage() {
  const params = useParams();
  const depositId = params.id as string;
  const { locale } = useTranslation();

  const [deposit, setDeposit] = useState<KazakhstanDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    const loadDeposit = async () => {
      try {
        setLoading(true);
        setError(null);

        const depositData = await depositApi.getById(depositId);

        if (!depositData) {
          setError('Объявление не найдено');
          return;
        }

        setDeposit(depositData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Произошла ошибка при загрузке данных'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDeposit();
  }, [depositId]);

  const jsonLd = useMemo(() => {
    if (!deposit) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: deposit.title,
      description: deposit.description,
      category: getTypeLabel(deposit.type),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'KZT',
        price: deposit.price || 0,
        availability:
          deposit.status === 'SOLD'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Mineral', value: deposit.mineral },
        { '@type': 'PropertyValue', name: 'Region', value: deposit.region },
        { '@type': 'PropertyValue', name: 'Type', value: deposit.type },
        {
          '@type': 'PropertyValue',
          name: 'Area',
          value: `${deposit.area} km²`,
        },
      ],
    };
  }, [deposit]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!deposit) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: `https://qaznedr.kz/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Объявления',
          item: `https://qaznedr.kz/${locale}/listings`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: deposit.title,
        },
      ],
    };
  }, [deposit, locale]);

  const handleFavoriteToggle = async () => {
    if (!deposit) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await favoritesApi.removeFromFavorites(deposit.id);
        setIsFavorite(false);
      } else {
        await favoritesApi.addToFavorites(deposit.id);
        setIsFavorite(true);
      }
    } catch {
      // silently fail
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!deposit) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/listings/${deposit.id}`
        : `/${locale}/listings/${deposit.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: deposit.title,
          text: deposit.description,
          url: shareUrl,
        });
      } catch {
        // AbortError is fine
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // silently fail
      }
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContactForm(false);
    setContactData({ name: '', email: '', phone: '', message: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Navigation />
        <div className="pt-20 lg:pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0A84FF] mx-auto mb-4" />
            <p className="text-sm text-gray-500">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center px-4">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
            {error || 'Объявление не найдено'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Возможно, объявление было удалено или перемещено
          </p>
          <Link
            href={`/${locale}/listings`}
            className="inline-flex items-center px-4 py-2 bg-[#0A84FF] text-white rounded-lg text-sm font-medium hover:bg-[#0070e0] transition-colors"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    if (price >= 1000000000000)
      return `${(price / 1000000000000).toFixed(1)} трлн ₸`;
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} млрд ₸`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} млн ₸`;
    return `${price.toLocaleString()} ₸`;
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Navigation />

        {/* Breadcrumb */}
        <div className="border-b border-gray-100 dark:border-gray-800 pt-20 lg:pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-gray-500">
                <li>
                  <Link
                    href={`/${locale}`}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Главная
                  </Link>
                </li>
                <li className="text-gray-300 dark:text-gray-600">/</li>
                <li>
                  <Link
                    href={`/${locale}/listings`}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Объявления
                  </Link>
                </li>
                <li className="text-gray-300 dark:text-gray-600">/</li>
                <li className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">
                  {deposit.title}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left: main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title section */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                  {getTypeLabel(deposit.type)}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                    {deposit.title}
                  </h1>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={getStatusVariant(deposit.status)}>
                      {getStatusText(deposit.status)}
                    </Badge>
                    {deposit.verified && (
                      <Badge variant="blue">Проверено</Badge>
                    )}
                    {deposit.featured && (
                      <Badge variant="default">Рекомендуем</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {deposit.region}, {deposit.city}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Просмотры
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                    {deposit.views}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Площадь
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                    {deposit.area.toLocaleString()} км²
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Ископаемое
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                    {deposit.mineral}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Регион
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                    {deposit.region}
                  </dd>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Описание объекта
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {deposit.description}
                </p>
              </div>

              {/* Type-specific Details */}
              {deposit.type === 'MINING_LICENSE' && (
                <MiningLicenseDetails deposit={deposit} />
              )}
              {deposit.type === 'EXPLORATION_LICENSE' && (
                <ExplorationLicenseDetails deposit={deposit} />
              )}
              {deposit.type === 'MINERAL_OCCURRENCE' && (
                <MineralOccurrenceDetails deposit={deposit} />
              )}

              {/* Location */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                  Местоположение
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Адрес
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
                      {deposit.region}, {deposit.city}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Координаты
                    </dt>
                    <dd className="text-sm font-mono text-gray-900 dark:text-gray-50 mt-1">
                      {deposit.coordinates[0].toFixed(6)},{' '}
                      {deposit.coordinates[1].toFixed(6)}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {deposit.documents.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                    Документы
                  </h2>
                  <div className="space-y-2">
                    {deposit.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#141414]"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {doc}
                          </span>
                        </div>
                        <button className="text-xs text-[#0A84FF] hover:text-[#0070e0] font-medium transition-colors">
                          Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing info */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
                  <span>ID: #{deposit.id}</span>
                  <span>
                    Размещено: {deposit.createdAt.toLocaleDateString('ru-RU')}
                  </span>
                  <span>
                    Обновлено: {deposit.updatedAt.toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="sticky top-20 space-y-4">
                {/* Price card */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414] shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
                    {formatPrice(deposit.price)}
                  </div>
                  {deposit.price && (
                    <div className="text-xs text-gray-400 mb-5">
                      Цена в тенге (₸)
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowMessaging(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A84FF] text-white rounded-lg text-sm font-medium hover:bg-[#0070e0] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Написать сообщение
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleFavoriteToggle}
                        disabled={favoriteLoading}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                          isFavorite
                            ? 'border-[#0A84FF] text-[#0A84FF] bg-[rgba(10,132,255,0.05)]'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {isFavorite ? (
                          <Heart className="w-4 h-4 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                        {isFavorite ? 'В избранном' : 'Сохранить'}
                      </button>

                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        title="Поделиться"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact reveal */}
                <ContactReveal
                  listingId={deposit.id}
                  sellerId={deposit.userId}
                  ownerName={deposit.contactName}
                  ownerPhone={deposit.contactPhone}
                  ownerEmail={deposit.contactEmail}
                />

                {/* Contact form toggle */}
                {!showContactForm ? (
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Форма обратной связи
                  </button>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-[#141414]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Обратная связь
                      </h3>
                      <button
                        onClick={() => setShowContactForm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Имя *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A84FF] transition-colors"
                          value={contactData.name}
                          onChange={(e) =>
                            setContactData({
                              ...contactData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A84FF] transition-colors"
                          value={contactData.email}
                          onChange={(e) =>
                            setContactData({
                              ...contactData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Сообщение *
                        </label>
                        <textarea
                          required
                          rows={3}
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A84FF] transition-colors resize-none"
                          value={contactData.message}
                          onChange={(e) =>
                            setContactData({
                              ...contactData,
                              message: e.target.value,
                            })
                          }
                          placeholder="Опишите ваш интерес..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-[#0A84FF] text-white rounded-lg text-sm font-medium hover:bg-[#0070e0] transition-colors"
                      >
                        Отправить
                      </button>
                    </form>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800">
                  <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Проверяйте документы и лицензии перед сделкой. QAZNEDR.KZ не
                    несёт ответственности за достоверность информации.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging modal */}
        {showMessaging && deposit && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMessaging(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-[#0a0a0a] shadow-elevated">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Связаться с продавцом
                </h2>
                <button
                  onClick={() => setShowMessaging(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-[#141414] px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 mb-0.5">Объявление</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {deposit.title}
                  </p>
                </div>
                <MessagingSystem />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
