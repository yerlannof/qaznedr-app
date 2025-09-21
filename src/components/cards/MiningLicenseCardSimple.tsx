'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';
import {
  ShieldCheck,
  Star,
  Eye,
  MapPin,
  Factory,
  Heart,
  Share2,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  MessageCircle,
} from 'lucide-react';

interface MiningLicenseCardSimpleProps {
  deposit: KazakhstanDeposit;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onAddToComparison?: (deposit: KazakhstanDeposit) => void;
  onRemoveFromComparison?: (id: string) => void;
  isInComparison?: boolean;
}

export default function MiningLicenseCardSimple({
  deposit,
  getStatusColor,
  getStatusText,
  onAddToComparison,
  onRemoveFromComparison,
  isInComparison = false,
}: MiningLicenseCardSimpleProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if listing is new (less than 7 days)
  const isNew = () => {
    const createdDate = new Date(deposit.createdAt || Date.now());
    const daysDiff =
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  // Check if listing is hot (more than 10 views per day)
  const isHot = () => {
    const createdDate = new Date(deposit.createdAt || Date.now());
    const daysSinceCreated = Math.max(
      1,
      Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    return deposit.views / daysSinceCreated > 10;
  };

  const getLicenseSubtypeText = (subtype?: string) => {
    const subtypes: Record<string, string> = {
      EXTRACTION_RIGHT: 'Право на добычу',
      PROCESSING_RIGHT: 'Право на переработку',
      TRANSPORTATION_RIGHT: 'Право на транспортировку',
      COMBINED_RIGHT: 'Комбинированные права',
    };
    return subtypes[subtype || ''] || 'Не указан';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      {/* Image Section - No animations */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Main Icon - Static */}
        <div className="absolute inset-0 flex items-center justify-center">
          {(() => {
            const Icon = getMineralIcon(deposit.mineral);
            return <Icon className="w-20 h-20 text-blue-600 opacity-60" />;
          })()}
        </div>

        {/* Quick Actions - Always visible on mobile */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="touch-target p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            />
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="touch-target p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg"
          >
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Status Badges - Static */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isNew() && (
            <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
              NEW
            </span>
          )}
          {isHot() && (
            <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
              HOT
            </span>
          )}
          {deposit.verified && (
            <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
              VERIFIED
            </span>
          )}
        </div>

        {/* Price Badge - Static */}
        <div className="absolute bottom-3 left-3">
          <div className="px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {formatPrice(deposit.price)}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Type */}
        <div className="mb-3">
          <Link
            href={`/listings/${deposit.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
          >
            {deposit.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {getLicenseSubtypeText(deposit.licenseSubtype)}
            </span>
            {deposit.licenseNumber && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  №{deposit.licenseNumber}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Location - Mobile optimized */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {deposit.region}
          </span>
        </div>

        {/* Key Metrics - Simplified grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Площадь
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {deposit.areaHectares?.toLocaleString()} га
            </div>
          </div>
          {deposit.reservesTons && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Запасы
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {deposit.reservesTons.toLocaleString()} т
              </div>
            </div>
          )}
        </div>

        {/* License Expiry */}
        {deposit.licenseExpiry && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Лицензия до:{' '}
              {new Date(deposit.licenseExpiry).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              deposit.status
            )}`}
          >
            {getStatusText(deposit.status)}
          </span>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {deposit.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {deposit.inquiries || 0}
            </span>
          </div>
        </div>

        {/* Comparison Button - Mobile friendly */}
        {onAddToComparison && (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (isInComparison) {
                onRemoveFromComparison?.(deposit.id);
              } else {
                onAddToComparison(deposit);
              }
            }}
            className={`mt-3 w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors touch-target ${
              isInComparison
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isInComparison ? 'В сравнении' : 'Добавить в сравнение'}
          </button>
        )}
      </div>
    </div>
  );
}
