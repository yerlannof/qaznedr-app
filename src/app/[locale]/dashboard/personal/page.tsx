'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import PersonalizedFeed from '@/components/features/PersonalizedFeed';
import { LiveActivityIndicator } from '@/components/features/SocialProof';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Filter,
  Download,
  Settings,
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
  color = 'blue',
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-100 p-6"
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change !== undefined && (
            <div
              className={`flex items-center text-sm mt-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`}
              />
              {Math.abs(change)}% за месяц
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function TrendingSearches({ searches }: { searches: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Популярные поиски</h3>
        <Filter className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-3">
        {searches.map((search, index) => (
          <motion.div
            key={search}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium text-gray-900">{search}</span>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />#{index + 1}
            </div>
          </motion.div>
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'text-blue-600 bg-blue-50';
      case 'inquiry':
        return 'text-green-600 bg-green-50';
      case 'favorite':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Недавняя активность</h3>
        <Calendar className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {getActivityLabel(activity.type)}
                </div>
                <div className="text-sm text-gray-600">
                  {activity.depositTitle}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {activity.timestamp}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Посмотреть всю активность →
        </button>
      </div>
    </div>
  );
}

export default function PersonalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboard = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStats(MOCK_STATS);
      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationSimple />
        <div className="pt-16 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Loading Header */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
            </div>

            {/* Loading Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-xl h-32 animate-pulse"
                />
              ))}
            </div>

            {/* Loading Content */}
            <div className="bg-gray-200 rounded-xl h-96 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Header */}
      <div className="pt-16 px-4 sm:px-6 lg:px-8 py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <motion.h1
                className="text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Персональная панель
              </motion.h1>
              <motion.p
                className="text-gray-600"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Управляйте вашими месторождениями и отслеживайте активность
              </motion.p>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                <span>Экспорт отчета</span>
              </motion.button>
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-4 h-4" />
                <span>Настройки</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
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
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StatsCard
                  title="Общие просмотры"
                  value={stats.totalViews.toLocaleString()}
                  change={12.5}
                  icon={Eye}
                  color="blue"
                />
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StatsCard
                  title="Активные объявления"
                  value={stats.totalListings}
                  change={8.3}
                  icon={BarChart3}
                  color="green"
                />
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StatsCard
                  title="Запросы"
                  value={stats.totalInquiries}
                  change={-2.1}
                  icon={Users}
                  color="purple"
                />
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StatsCard
                  title="Конверсия"
                  value={`${stats.conversionRate}%`}
                  change={5.7}
                  icon={TrendingUp}
                  color="orange"
                />
              </motion.div>
            </motion.div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Activity */}
              <div className="space-y-6">
                <TrendingSearches searches={stats.trendingSearches} />
                <RecentActivity activities={stats.recentActivity} />
              </div>

              {/* Right Columns - Personalized Feed */}
              <div className="lg:col-span-2">
                <PersonalizedFeed />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Live Activity Indicator */}
      <LiveActivityIndicator />
    </div>
  );
}
