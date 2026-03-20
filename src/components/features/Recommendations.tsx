'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Eye,
  Clock,
  TrendingUp,
  Heart,
  MapPin,
  Factory,
  Star,
  Sparkles,
  User,
  History,
  Target,
  Zap,
} from 'lucide-react';
import { KazakhstanDeposit, MineralType } from '@/lib/types/listing';
import { getMineralIcon } from '@/components/icons';

interface RecommendationsProps {
  currentDeposit?: KazakhstanDeposit;
  userPreferences?: {
    preferredMinerals?: string[];
    preferredRegions?: string[];
    priceRange?: { min: number; max: number };
    viewHistory?: string[];
  };
  className?: string;
}

interface RecommendationReason {
  type: 'similar' | 'trending' | 'personalized' | 'location' | 'price';
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const RECOMMENDATION_REASONS: Record<string, RecommendationReason> = {
  similar: {
    type: 'similar',
    label: 'Похожее месторождение',
    icon: Target,
    color: 'blue',
  },
  trending: {
    type: 'trending',
    label: 'Популярно сейчас',
    icon: TrendingUp,
    color: 'red',
  },
  personalized: {
    type: 'personalized',
    label: 'Для вас',
    icon: Sparkles,
    color: 'purple',
  },
  location: {
    type: 'location',
    label: 'В вашем регионе',
    icon: MapPin,
    color: 'green',
  },
  price: {
    type: 'price',
    label: 'В вашем бюджете',
    icon: Zap,
    color: 'yellow',
  },
};

// Mock recommendations data
const generateRecommendations = (
  currentDeposit?: KazakhstanDeposit,
  userPreferences?: any
): Array<KazakhstanDeposit & { reason: string; score: number }> => {
  // This would normally come from an AI recommendation engine
  const baseRecommendations: Array<
    KazakhstanDeposit & { reason: string; score: number }
  > = [
    {
      id: 'rec-1',
      title: 'Месторождение Актюбинск Голд',
      description:
        'Перспективное золотое месторождение с подтвержденными запасами и современной инфраструктурой.',
      price: 2500000000,
      area: 850,
      mineral: 'Золото' as MineralType,
      region: 'Актюбинская',
      city: 'Актобе',
      type: 'MINING_LICENSE' as const,
      verified: true,
      views: 1247,
      createdAt: new Date('2025-01-10'),
      coordinates: [48.0196, 66.9237],
      featured: false,
      status: 'ACTIVE' as const,
      images: [],
      documents: [],
      userId: 'user-123',
      updatedAt: new Date(),
      reason: 'similar',
      score: 0.92,
      licenseNumber: 'KZ-ML-2025-001',
      licenseExpiry: new Date('2030-01-01'),
      licenseSubtype: 'EXTRACTION_RIGHT' as const,
    },
    {
      id: 'rec-2',
      title: 'Нефтяной участок Западный Прикаспий',
      description:
        'Высокопотенциальный участок для нефтедобычи в перспективном регионе.',
      price: 8900000000,
      area: 2400,
      mineral: 'Нефть' as MineralType,
      region: 'Мангистауская',
      city: 'Актау',
      type: 'EXPLORATION_LICENSE' as const,
      verified: true,
      views: 2156,
      createdAt: new Date('2025-01-08'),
      coordinates: [43.6532, 51.1605],
      featured: false,
      status: 'ACTIVE' as const,
      images: [],
      documents: [],
      userId: 'user-124',
      updatedAt: new Date(),
      reason: 'trending',
      score: 0.88,
      explorationStage: 'DETAILED' as const,
      explorationPeriod: {
        start: new Date('2025-01-01'),
        end: new Date('2028-12-31'),
      },
      explorationBudget: 500000000,
    },
    {
      id: 'rec-3',
      title: 'Месторождение Медный Альтай',
      description:
        'Крупное медное месторождение с развитой логистической инфраструктурой.',
      price: 4200000000,
      area: 1650,
      mineral: 'Медь' as MineralType,
      region: 'Восточно-Казахстанская',
      city: 'Усть-Каменогорск',
      type: 'MINING_LICENSE' as const,
      verified: false,
      views: 892,
      createdAt: new Date('2025-01-06'),
      coordinates: [49.948, 82.6274],
      featured: false,
      status: 'ACTIVE' as const,
      images: [],
      documents: [],
      userId: 'user-125',
      updatedAt: new Date(),
      reason: 'personalized',
      score: 0.85,
      licenseNumber: 'KZ-ML-2025-003',
      licenseExpiry: new Date('2029-06-01'),
      licenseSubtype: 'EXTRACTION_RIGHT' as const,
    },
  ];

  return baseRecommendations;
};

export function RecommendationCard({
  deposit,
  reason,
  score,
  onView,
}: {
  deposit: KazakhstanDeposit & { reason: string; score: number };
  reason: RecommendationReason;
  score: number;
  onView?: (id: string) => void;
}) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const Icon = reason.icon;
  const MineralIcon = getMineralIcon(deposit.mineral);

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer"
      onClick={() => onView?.(deposit.id)}
    >
      {/* Header with Recommendation Reason */}
      <div className="relative p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              reason.color === 'blue'
                ? 'bg-gray-100 text-gray-700'
                : reason.color === 'red'
                  ? 'bg-red-50 text-red-700'
                  : reason.color === 'purple'
                    ? 'bg-gray-50 text-gray-700'
                    : reason.color === 'green'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{reason.label}</span>
          </div>

          {/* Match Score */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{Math.round(score * 100)}% совпадение</span>
          </div>
        </div>

        {/* Mineral Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg mb-3">
          <MineralIcon className="w-6 h-6 text-gray-600" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-gray-600 transition-colors">
          {deposit.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {deposit.city}
          </span>
          <span className="flex items-center gap-1">
            <Factory className="w-3 h-3" />
            {deposit.mineral}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {deposit.description}
        </p>

        {/* Price & Stats */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(deposit.price)}
            </div>
            <div className="text-xs text-gray-500">
              {deposit.area.toLocaleString()} км²
            </div>
          </div>

          <div className="flex items-center text-xs text-gray-500">
            <Eye className="w-3 h-3 mr-1" />
            {deposit.views}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecentlyViewed({
  viewHistory = [],
  className = '',
}: {
  viewHistory?: string[];
  className?: string;
}) {
  const [recentDeposits, setRecentDeposits] = useState<KazakhstanDeposit[]>([]);

  useEffect(() => {
    // Mock recent viewed data - in real app this would come from user history
    const mockRecent: KazakhstanDeposit[] = [
      {
        id: 'recent-1',
        title: 'Золотое месторождение Алтын',
        price: 1800000000,
        mineral: 'Золото' as MineralType,
        region: 'Павлодарская' as const,
        city: 'Павлодар',
        area: 620,
        type: 'MINING_LICENSE' as const,
        verified: true,
        views: 456,
        description: 'Перспективное золотое месторождение',
        createdAt: new Date(),
        updatedAt: new Date(),
        coordinates: [52.2873, 76.9674] as [number, number],
        featured: false,
        status: 'ACTIVE' as const,
        images: [],
        documents: [],
        userId: 'user-123',
        licenseNumber: 'KZ-ML-2025-003',
        licenseExpiry: new Date('2031-01-01'),
        licenseSubtype: 'EXTRACTION_RIGHT' as const,
      },
      {
        id: 'recent-2',
        title: 'Угольный разрез Карагандинский',
        price: 5200000000,
        mineral: 'Уголь' as MineralType,
        region: 'Карагандинская' as const,
        city: 'Караганда',
        area: 1850,
        type: 'MINING_LICENSE' as const,
        verified: true,
        views: 789,
        description: 'Крупное угольное месторождение',
        createdAt: new Date(),
        updatedAt: new Date(),
        coordinates: [49.8047, 73.1094] as [number, number],
        featured: false,
        status: 'ACTIVE' as const,
        images: [],
        documents: [],
        userId: 'user-124',
        licenseNumber: 'KZ-ML-2025-004',
        licenseExpiry: new Date('2032-01-01'),
        licenseSubtype: 'EXTRACTION_RIGHT' as const,
      },
    ];

    setRecentDeposits(mockRecent);
  }, [viewHistory]);

  if (recentDeposits.length === 0) return null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Недавно просмотренные</h3>
      </div>

      <div className="space-y-3">
        {recentDeposits.map((deposit, index) => {
          const MineralIcon = getMineralIcon(deposit.mineral);

          return (
            <div key={deposit.id}>
              <Link
                href={`/listings/${deposit.id}`}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MineralIcon className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm group-hover:text-gray-600 transition-colors line-clamp-1">
                    {deposit.title}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {deposit.city}
                    <span className="mx-2">•</span>
                    <Eye className="w-3 h-3 mr-1" />
                    {deposit.views}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('ru-KZ', {
                      style: 'currency',
                      currency: 'KZT',
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(deposit.price || 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {deposit.area} км²
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link
          href="/dashboard/history"
          className="text-sm text-[#0A84FF] hover:text-[#0070E0] font-medium"
        >
          Посмотреть всю историю →
        </Link>
      </div>
    </div>
  );
}

export default function Recommendations({
  currentDeposit,
  userPreferences,
  className = '',
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    Array<KazakhstanDeposit & { reason: string; score: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for recommendations
    const loadRecommendations = async () => {
      setIsLoading(true);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const recs = generateRecommendations(currentDeposit, userPreferences);
      setRecommendations(recs);
      setIsLoading(false);
    };

    loadRecommendations();
  }, [currentDeposit, userPreferences]);

  const handleViewRecommendation = (id: string) => {
    // Track recommendation click analytics
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">
            Рекомендации для вас
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div>
          <Sparkles className="w-5 h-5 text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Рекомендации для вас
        </h2>
        <div className="text-sm text-gray-500">
          • На основе ваших предпочтений
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {recommendations.map((rec) => {
            const reason = RECOMMENDATION_REASONS[rec.reason];

            return (
              <div key={rec.id}>
                <RecommendationCard
                  deposit={rec}
                  reason={reason}
                  score={rec.score}
                  onView={handleViewRecommendation}
                />
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
          Показать больше рекомендаций
        </button>
      </div>
    </div>
  );
}
