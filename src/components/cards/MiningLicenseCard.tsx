'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { getMineralIcon } from '@/components/icons';
import {
  ViewingNowIndicator,
  TrustBadge,
} from '@/components/features/SocialProof';
import { AddToComparisonButton } from '@/components/features/DepositComparison';
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

interface MiningLicenseCardProps {
  deposit: KazakhstanDeposit;
  formatPrice: (price: number | null) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onAddToComparison?: (deposit: KazakhstanDeposit) => void;
  onRemoveFromComparison?: (id: string) => void;
  isInComparison?: boolean;
}

export default function MiningLicenseCard({
  deposit,
  formatPrice,
  getStatusColor,
  getStatusText,
  onAddToComparison,
  onRemoveFromComparison,
  isInComparison = false,
}: MiningLicenseCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
    <motion.div
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        y: -8,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image Section with Improved Design */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,theme(colors.blue.400),transparent)]" />
        </div>

        {/* Main Icon with Animation */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {(() => {
            const Icon = getMineralIcon(deposit.mineral);
            return <Icon className="w-20 h-20 text-blue-600 opacity-60" />;
          })()}
        </motion.div>

        {/* Quick Actions - Animated Slide-in */}
        <motion.div
          className="absolute top-3 right-3 flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                scale: isFavorite ? [1, 1.3, 1] : 1,
                rotate: isFavorite ? [0, 10, -10, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </motion.div>
          </motion.button>
          <motion.button
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </motion.button>
        </motion.div>

        {/* Status Badges - Animated */}
        <motion.div
          className="absolute top-3 left-3 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {isNew() && (
            <motion.span
              className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              NEW
            </motion.span>
          )}
          {isHot() && (
            <motion.span
              className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold flex items-center gap-1"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.7)',
                  '0 0 0 4px rgba(239, 68, 68, 0)',
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            >
              <TrendingUp className="w-3 h-3" />
              HOT
            </motion.span>
          )}
          {deposit.verified && (
            <motion.span
              className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-semibold flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <ShieldCheck className="w-3 h-3" />
              Проверено
            </motion.span>
          )}

          {/* Social Proof Badge */}
          <ViewingNowIndicator depositId={deposit.id} />
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          {/* Title and Location */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {deposit.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {deposit.city}
            </span>
            <span className="flex items-center gap-1">
              <Factory className="w-3.5 h-3.5" />
              {deposit.mineral}
            </span>
          </div>
        </div>

        {/* Key Metrics - Grid Layout */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-0.5">Площадь</div>
            <div className="text-sm font-semibold text-gray-900">
              {deposit.area.toLocaleString()} км²
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-0.5">Лицензия</div>
            <div className="text-sm font-semibold text-gray-900">
              {deposit.licenseNumber || 'Не указан'}
            </div>
          </div>
        </div>

        {/* Description - Truncated */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {deposit.description}
        </p>

        {/* Price Section */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(deposit.price)}
          </div>
          {deposit.price && deposit.area > 0 && (
            <div className="text-xs text-gray-500 mt-0.5">
              {formatPrice(Math.round(deposit.price / deposit.area))} за км²
            </div>
          )}
        </div>

        {/* Social Activity Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {deposit.views} просмотров
            </span>
            <motion.span
              className="flex items-center gap-1 text-orange-600"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="w-3.5 h-3.5" />
              {Math.floor(Math.random() * 25) + 5} интересуются
            </motion.span>
            <motion.span
              className="flex items-center gap-1 text-blue-600"
              whileHover={{ scale: 1.05 }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {Math.floor(Math.random() * 8) + 2} вопросов
            </motion.span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {deposit.licenseExpiry
              ? `до ${new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}`
              : 'Бессрочно'}
          </span>
          <div className="flex items-center space-x-2">
            <TrustBadge
              type="listing"
              verified={deposit.verified}
              className="text-xs px-2 py-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Link
            href={`/listings/${deposit.id}`}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm"
          >
            Подробнее
          </Link>
          <button className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MapPin className="w-4 h-4 text-gray-600" />
          </button>

          {/* Comparison Button */}
          {(onAddToComparison || onRemoveFromComparison) && (
            <AddToComparisonButton
              deposit={deposit}
              isAdded={isInComparison}
              onAdd={onAddToComparison || (() => {})}
              onRemove={onRemoveFromComparison || (() => {})}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
