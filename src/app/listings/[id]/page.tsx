'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import MiningLicenseDetails from '@/components/detail-sections/MiningLicenseDetails';
import ExplorationLicenseDetails from '@/components/detail-sections/ExplorationLicenseDetails';
import MineralOccurrenceDetails from '@/components/detail-sections/MineralOccurrenceDetails';
import { depositApi } from '@/lib/api/deposits';
import { favoritesApi } from '@/lib/api/favorites';
import type { KazakhstanDeposit } from '@/lib/types/listing';

export default function DepositDetailPage() {
  const params = useParams();
  const depositId = params.id as string;

  const [deposit, setDeposit] = useState<KazakhstanDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Загрузка данных объявления
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
        console.error('Error loading deposit:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDeposit();
  }, [depositId]);

  // Обработка добавления/удаления из избранного
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
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка объявления...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Объявление не найдено'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'Объявление не найдено'
              ? 'Возможно, объявление было удалено или перемещено'
              : 'Произошла ошибка при загрузке данных'}
          </p>
          <Link
            href="/listings"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет логика отправки сообщения
    alert('Сообщение отправлено! Продавец свяжется с вами в ближайшее время.');
    setShowContactForm(false);
    setContactData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Главная
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <Link
                  href="/listings"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Объявления
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium truncate max-w-xs">
                  {deposit.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {getMineralIcon(deposit.mineral)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {deposit.title}
                    </h1>
                    <p className="text-lg text-gray-600">
                      {deposit.region}, {deposit.city}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(deposit.status)}`}
                  >
                    {getStatusText(deposit.status)}
                  </span>
                  {deposit.verified && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                      ✓ Проверено
                    </span>
                  )}
                  {deposit.featured && (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                      Рекомендуем
                    </span>
                  )}
                </div>
              </div>

              <div className="text-4xl font-bold text-blue-600 mb-4">
                {formatPrice(deposit.price)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Просмотры:</span>
                  <div className="font-medium text-gray-900">
                    {deposit.views}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Площадь:</span>
                  <div className="font-medium text-gray-900">
                    {deposit.area.toLocaleString()} км²
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Тип объекта:</span>
                  <div className="font-medium text-gray-900">
                    {deposit.type === 'MINING_LICENSE' && 'Лицензия на добычу'}
                    {deposit.type === 'EXPLORATION_LICENSE' &&
                      'Лицензия на разведку'}
                    {deposit.type === 'MINERAL_OCCURRENCE' && 'Рудопроявление'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Полезное ископаемое:</span>
                  <div className="font-medium text-gray-900">
                    {deposit.mineral}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Описание объекта
              </h2>
              <p className="text-gray-700 leading-relaxed">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Местоположение
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Адрес</h3>
                  <p className="text-gray-700">
                    {deposit.region}, {deposit.city}
                  </p>

                  <h3 className="font-medium text-gray-900 mb-2 mt-4">
                    Координаты
                  </h3>
                  <p className="text-gray-700 font-mono text-sm">
                    {deposit.coordinates[0].toFixed(6)},{' '}
                    {deposit.coordinates[1].toFixed(6)}
                  </p>
                </div>
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p>Интерактивная карта</p>
                    <p className="text-sm">(в разработке)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            {deposit.documents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Документы
                </h2>
                <div className="space-y-3">
                  {deposit.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📄</div>
                        <span className="font-medium text-gray-900">{doc}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Скачать
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Связаться с продавцом
              </h3>

              {!showContactForm ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Отправить сообщение
                  </button>
                  <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                    📞 Позвонить
                  </button>
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isFavorite
                        ? 'bg-red-100 text-red-900 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {favoriteLoading
                      ? '⏳ Загрузка...'
                      : isFavorite
                        ? '❤️ Удалить из избранного'
                        : '💾 Добавить в избранное'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactData.name}
                      onChange={(e) =>
                        setContactData({ ...contactData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactData.phone}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Сообщение *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactData.message}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          message: e.target.value,
                        })
                      }
                      placeholder="Опишите ваш интерес к месторождению..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Отправить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация об объявлении
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID объявления:</span>
                  <span className="font-medium text-gray-900">
                    #{deposit.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Размещено:</span>
                  <span className="font-medium text-gray-900">
                    {deposit.createdAt.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Обновлено:</span>
                  <span className="font-medium text-gray-900">
                    {deposit.updatedAt.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Просмотры:</span>
                  <span className="font-medium text-gray-900">
                    {deposit.views}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Важное предупреждение
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Проверяйте все документы и лицензии перед совершением
                    сделки. QAZNEDR.KZ не несет ответственности за достоверность
                    информации.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
