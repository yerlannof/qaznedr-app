'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  Bell,
  Heart,
  Eye,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  Filter,
  Bookmark,
  Search,
  ChevronDown,
  Target,
  Zap
} from 'lucide-react';
import { KazakhstanDeposit } from '@/lib/types/listing';
import Recommendations, { RecentlyViewed } from './Recommendations';

interface PersonalizedFeedProps {
  className?: string;
  userId?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    minerals: string[];
    regions: string[];
    priceRange: { min: number; max: number };
    notifications: boolean;
  };
  stats: {
    viewedCount: number;
    savedCount: number;
    comparisonsCount: number;
    completeness: number;
  };
}

const MOCK_USER_PROFILE: UserProfile = {
  id: 'user-1',
  name: 'Данияр Касымов',
  email: 'daniyar@example.com',
  preferences: {
    minerals: ['Gold', 'Copper', 'Oil'],
    regions: ['Мангистауская', 'Атырауская'],
    priceRange: { min: 1000000000, max: 10000000000 },
    notifications: true
  },
  stats: {
    viewedCount: 24,
    savedCount: 8,
    comparisonsCount: 3,
    completeness: 75
  }
};

function UserProfileCard({ 
  profile, 
  className = '' 
}: { 
  profile: UserProfile;
  className?: string;
}) {
  return (
    <motion.div 
      className={`bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl p-6 border border-gray-100 ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{profile.name}</h3>
          <p className="text-sm text-gray-600">{profile.email}</p>
        </div>
        <div className="ml-auto">
          <Link
            href="/profile/settings"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Завершенность профиля</span>
          <span className="text-sm text-gray-600">{profile.stats.completeness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${profile.stats.completeness}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-lg font-semibold text-gray-900">{profile.stats.viewedCount}</div>
          <div className="text-xs text-gray-600 flex items-center justify-center">
            <Eye className="w-3 h-3 mr-1" />
            Просмотрено
          </div>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-lg font-semibold text-gray-900">{profile.stats.savedCount}</div>
          <div className="text-xs text-gray-600 flex items-center justify-center">
            <Heart className="w-3 h-3 mr-1" />
            Сохранено
          </div>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-lg font-semibold text-gray-900">{profile.stats.comparisonsCount}</div>
          <div className="text-xs text-gray-600 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Сравнений
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SavedSearches({ className = '' }: { className?: string }) {
  const [savedSearches] = useState([
    {
      id: 'search-1',
      query: 'Золото Алтай',
      filters: { mineral: 'Gold', region: 'Восточно-Казахстанская' },
      results: 12,
      lastUpdated: '2 часа назад',
      hasNewResults: true
    },
    {
      id: 'search-2',
      query: 'Нефть до 5 млрд',
      filters: { mineral: 'Oil', maxPrice: 5000000000 },
      results: 8,
      lastUpdated: '1 день назад',
      hasNewResults: false
    },
    {
      id: 'search-3',
      query: 'Мангистау',
      filters: { region: 'Мангистауская' },
      results: 15,
      lastUpdated: '3 дня назад',
      hasNewResults: true
    }
  ]);

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Сохраненные поиски</h3>
        </div>
        <Link 
          href="/dashboard/searches"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Все поиски
        </Link>
      </div>

      <div className="space-y-3">
        {savedSearches.map((search, index) => (
          <motion.div
            key={search.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {search.query}
                  </span>
                  {search.hasNewResults && (
                    <motion.div
                      className="w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {search.results} результатов • {search.lastUpdated}
                </div>
              </div>
              
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PriceAlerts({ className = '' }: { className?: string }) {
  const [alerts] = useState([
    {
      id: 'alert-1',
      deposit: 'Месторождение Тенгиз-2',
      currentPrice: 8500000000,
      targetPrice: 8000000000,
      change: -2.1,
      active: true
    },
    {
      id: 'alert-2',
      deposit: 'Золотой рудник Васильковский',
      currentPrice: 2800000000,
      targetPrice: 3000000000,
      change: 1.5,
      active: true
    }
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(price);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Ценовые уведомления</h3>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          + Добавить
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 border border-gray-100 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 text-sm">
                {alert.deposit}
              </span>
              <div className={`flex items-center space-x-1 text-xs ${
                alert.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-3 h-3 ${alert.change < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(alert.change)}%
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Текущая: {formatPrice(alert.currentPrice)} • 
              Цель: {formatPrice(alert.targetPrice)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuickActions({ className = '' }: { className?: string }) {
  const actions = [
    {
      id: 'create',
      label: 'Создать объявление',
      icon: Zap,
      color: 'blue',
      href: '/listings/create'
    },
    {
      id: 'saved',
      label: 'Избранное',
      icon: Heart,
      color: 'red',
      href: '/dashboard/favorites'
    },
    {
      id: 'compare',
      label: 'Сравнения',
      icon: TrendingUp,
      color: 'green',
      href: '/dashboard/comparisons'
    },
    {
      id: 'analytics',
      label: 'Аналитика',
      icon: Target,
      color: 'purple',
      href: '/dashboard/analytics'
    }
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={action.href}
              className={`block p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group ${
                action.color === 'blue' ? 'hover:border-blue-200' :
                action.color === 'red' ? 'hover:border-red-200' :
                action.color === 'green' ? 'hover:border-green-200' :
                'hover:border-purple-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                action.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                action.color === 'red' ? 'bg-red-50 text-red-600' :
                action.color === 'green' ? 'bg-green-50 text-green-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {action.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function PersonalizedFeed({ 
  className = '',
  userId = 'user-1'
}: PersonalizedFeedProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user profile
    const loadProfile = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUserProfile(MOCK_USER_PROFILE);
      setIsLoading(false);
    };

    loadProfile();
  }, [userId]);

  if (isLoading || !userProfile) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-gray-100 rounded-xl h-32 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Profile Header */}
      <UserProfileCard profile={userProfile} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Recent */}
        <div className="space-y-6">
          <QuickActions />
          <RecentlyViewed viewHistory={[]} />
        </div>

        {/* Middle Column - Saved Searches */}
        <div className="space-y-6">
          <SavedSearches />
          <PriceAlerts />
        </div>

        {/* Right Column - Recommendations */}
        <div className="lg:col-span-1">
          <Recommendations 
            userPreferences={userProfile.preferences}
            className="lg:sticky lg:top-4"
          />
        </div>
      </div>
    </div>
  );
}