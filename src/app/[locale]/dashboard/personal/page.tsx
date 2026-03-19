'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layouts/Navigation';
import PersonalizedFeed from '@/components/features/PersonalizedFeed';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';

interface DashboardStats {
  totalViews: number;
  totalListings: number;
  totalInquiries: number;
  conversionRate: number;
  trendingSearches: string[];
  recentActivity: Array<{
    id: string;
    type: 'view' | 'inquiry' | 'favorite';
    depositTitle: string;
    timestamp: string;
  }>;
}

const MOCK_STATS: DashboardStats = {
  totalViews: 12847,
  totalListings: 45,
  totalInquiries: 23,
  conversionRate: 3.2,
  trendingSearches: ['Золото Алтай', 'Нефть Мангистау', 'Медь Карагандинская'],
  recentActivity: [
    {
      id: '1',
      type: 'view',
      depositTitle: 'Месторождение Тенгиз',
      timestamp: '5 минут назад',
    },
    {
      id: '2',
      type: 'inquiry',
      depositTitle: 'Золотое месторождение Алтын',
      timestamp: '15 минут назад',
    },
    {
      id: '3',
      type: 'favorite',
      depositTitle: 'Угольный разрез Экибастуз',
      timestamp: '1 час назад',
    },
  ],
};

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
        {value}
      </p>
      {change !== undefined && (
        <p
          className={`flex items-center gap-1 text-xs mt-1 ${
            change >= 0 ? 'text-[#0A84FF]' : 'text-red-500'
          }`}
        >
          <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(change)}% за месяц
        </p>
      )}
    </div>
  );
}

function TrendingSearches({ searches }: { searches: string[] }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Популярные поиски
        </h3>
        <Filter className="w-4 h-4 text-gray-400" />
      </div>

      <div className="space-y-2">
        {searches.map((search, index) => (
          <div
            key={search}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {search}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <TrendingUp className="w-3 h-3" />#{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({
  activities,
}: {
  activities: DashboardStats['recentActivity'];
}) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return Eye;
      case 'inquiry':
        return Users;
      case 'favorite':
        return TrendingUp;
      default:
        return Eye;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Просмотр';
      case 'inquiry':
        return 'Запрос';
      case 'favorite':
        return 'В избранное';
      default:
        return 'Действие';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Недавняя активность
        </h3>
        <Calendar className="w-4 h-4 text-gray-400" />
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                  {getActivityLabel(activity.type)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {activity.depositTitle}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button className="text-xs text-[#0A84FF] hover:underline font-medium">
          Посмотреть всю активность
        </button>
      </div>
    </div>
  );
}

export default function PersonalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStats(MOCK_STATS);
      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-56 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-80 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] h-28 animate-pulse"
                />
              ))}
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] h-80 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Персональная панель
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Управляйте вашими месторождениями и отслеживайте активность
            </p>
          </div>

          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  title="Общие просмотры"
                  value={stats.totalViews.toLocaleString()}
                  change={12.5}
                  icon={Eye}
                />
                <StatsCard
                  title="Активные объявления"
                  value={stats.totalListings}
                  change={8.3}
                  icon={BarChart3}
                />
                <StatsCard
                  title="Запросы"
                  value={stats.totalInquiries}
                  change={-2.1}
                  icon={Users}
                />
                <StatsCard
                  title="Конверсия"
                  value={`${stats.conversionRate}%`}
                  change={5.7}
                  icon={TrendingUp}
                />
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <TrendingSearches searches={stats.trendingSearches} />
                  <RecentActivity activities={stats.recentActivity} />
                </div>

                <div className="lg:col-span-2">
                  <PersonalizedFeed />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
