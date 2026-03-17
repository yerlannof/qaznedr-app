'use client';

import { useState } from 'react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import PriceTrendAnalytics from '@/components/features/PriceTrendAnalytics';
import {
  kazakhstanDeposits,
  getDepositStats,
} from '@/lib/data/kazakhstan-deposits';
import { REGIONS, MINERALS } from '@/lib/types/listing';
import Footer from '@/components/layouts/Footer';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics');

  const stats = getDepositStats();

  // Группировка по регионам
  const regionStats = REGIONS.map((region) => {
    const deposits = kazakhstanDeposits.filter((d) => d.region === region);
    const totalValue = deposits
      .filter((d) => d.price)
      .reduce((sum, d) => sum + (d.price || 0), 0);

    return {
      region,
      count: deposits.length,
      totalValue,
      avgPrice: deposits.length > 0 ? totalValue / deposits.length : 0,
      verified: deposits.filter((d) => d.verified).length,
    };
  })
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count);

  // Группировка по минералам
  const mineralStats = MINERALS.map((mineral) => {
    const deposits = kazakhstanDeposits.filter((d) => d.mineral === mineral);
    const totalValue = deposits
      .filter((d) => d.price)
      .reduce((sum, d) => sum + (d.price || 0), 0);

    return {
      mineral,
      count: deposits.length,
      totalValue,
      avgPrice: deposits.length > 0 ? totalValue / deposits.length : 0,
      avgArea:
        deposits.length > 0
          ? deposits.reduce((sum, d) => sum + d.area, 0) / deposits.length
          : 0,
    };
  })
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count);

  // Топ месторождения по просмотрам
  const topByViews = [...kazakhstanDeposits]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Недавно добавленные
  const recentDeposits = [...kazakhstanDeposits]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const formatPrice = (price: number) => {
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

  const tabs = [
    { id: 'analytics', name: 'Аналитика цен', icon: '📊' },
    { id: 'overview', name: 'Обзор', icon: '📈' },
    { id: 'regions', name: 'По регионам', icon: '🗺️' },
    { id: 'minerals', name: 'По минералам', icon: '💎' },
    { id: 'trends', name: 'Тренды', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Аналитический дашборд
            </h1>
            <p className="text-gray-600">
              Статистика и аналитика платформы недропользования Казахстана
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Analytics Tab */}
              {activeTab === 'analytics' && <PriceTrendAnalytics />}

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">
                            Всего месторождений
                          </p>
                          <p className="text-3xl font-bold text-blue-900">
                            {stats.total}
                          </p>
                        </div>
                        <div className="text-blue-600 text-3xl">⛏️</div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">
                            Проверенных
                          </p>
                          <p className="text-3xl font-bold text-green-900">
                            {stats.verified}
                          </p>
                        </div>
                        <div className="text-green-600 text-3xl">✅</div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">
                            Регионов
                          </p>
                          <p className="text-3xl font-bold text-yellow-900">
                            {stats.regions}
                          </p>
                        </div>
                        <div className="text-yellow-600 text-3xl">🗺️</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">
                            Типов минералов
                          </p>
                          <p className="text-3xl font-bold text-blue-900">
                            {stats.minerals}
                          </p>
                        </div>
                        <div className="text-blue-600 text-3xl">💎</div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top by Views */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Топ по просмотрам
                      </h3>
                      <div className="space-y-4">
                        {topByViews.map((deposit, index) => (
                          <div
                            key={deposit.id}
                            className="flex items-center space-x-3"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {deposit.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {deposit.region}, {deposit.mineral}
                              </p>
                            </div>
                            <div className="text-sm text-gray-900 font-medium">
                              👁 {deposit.views}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Deposits */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Недавно добавленные
                      </h3>
                      <div className="space-y-4">
                        {recentDeposits.map((deposit) => (
                          <div
                            key={deposit.id}
                            className="flex items-center space-x-3"
                          >
                            <div className="text-2xl">
                              {getMineralIcon(deposit.mineral)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {deposit.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {deposit.createdAt.toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            {deposit.verified && (
                              <div className="text-green-600 text-sm">✅</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regions Tab */}
              {activeTab === 'regions' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Статистика по регионам
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regionStats.map((stat) => (
                      <div
                        key={stat.region}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            {stat.region}
                          </h4>
                          <span className="text-2xl">🗺️</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Месторождений:
                            </span>
                            <span className="font-medium text-gray-900">
                              {stat.count}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Проверенных:</span>
                            <span className="font-medium text-gray-900">
                              {stat.verified}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Общая стоимость:
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(stat.totalValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minerals Tab */}
              {activeTab === 'minerals' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Статистика по полезным ископаемым
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mineralStats.map((stat) => (
                      <div
                        key={stat.mineral}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            {stat.mineral}
                          </h4>
                          <span className="text-2xl">
                            {getMineralIcon(stat.mineral)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Месторождений:
                            </span>
                            <span className="font-medium text-gray-900">
                              {stat.count}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Общая стоимость:
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(stat.totalValue)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Средняя площадь:
                            </span>
                            <span className="font-medium text-gray-900">
                              {stat.avgArea.toLocaleString()} км²
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Анализ трендов
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Интерактивные графики и тренды в разработке
                  </p>
                  <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      Скоро здесь появятся:
                      <br />
                      • Динамика цен по месяцам
                      <br />
                      • Популярность регионов
                      <br />
                      • Активность пользователей
                      <br />• Прогнозы рынка
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
