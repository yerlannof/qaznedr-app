'use client';

import Link from 'next/link';
import Image from 'next/image';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';
import { getPlaceholderImage } from '@/lib/images/placeholders';

interface MineralOccurrenceCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function MineralOccurrenceCard({
  deposit,
  getStatusColor,
  getStatusText,
}: MineralOccurrenceCardProps) {
  const getConfidenceText = (confidence?: string) => {
    const confidences: Record<string, string> = {
      INFERRED: 'Предполагаемые',
      INDICATED: 'Вероятные',
      MEASURED: 'Достоверные',
    };
    return confidences[confidence || ''] || 'Не определена';
  };

  const getAccessibilityText = (rating?: string) => {
    const ratings: Record<string, string> = {
      EASY: 'Легкий доступ',
      MODERATE: 'Умеренный доступ',
      DIFFICULT: 'Сложный доступ',
      VERY_DIFFICULT: 'Очень сложный доступ',
    };
    return ratings[rating || ''] || 'Не оценен';
  };

  const getAccessibilityColor = (rating?: string) => {
    const colors: Record<string, string> = {
      EASY: 'text-green-600',
      MODERATE: 'text-yellow-600',
      DIFFICULT: 'text-orange-600',
      VERY_DIFFICULT: 'text-red-600',
    };
    return colors[rating || ''] || 'text-gray-600';
  };

  // Get image URL - use first image from array or placeholder
  const imageUrl =
    deposit.images && Array.isArray(deposit.images) && deposit.images.length > 0
      ? deposit.images[0]
      : getPlaceholderImage(deposit.mineral, deposit.type);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-[4/3] relative bg-gray-50">
        <Image
          src={imageUrl}
          alt={deposit.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const iconDiv = target.nextElementSibling as HTMLDivElement;
            if (iconDiv) iconDiv.style.display = 'flex';
          }}
        />
        <div className="absolute inset-0 hidden items-center justify-center">
          {(() => {
            const Icon = getMineralIcon(deposit.mineral);
            return <Icon className="w-20 h-20 text-blue-600 opacity-60" />;
          })()}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium">
            Рудопроявление
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {deposit.featured && (
            <span className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs font-medium">
              Рекомендуем
            </span>
          )}
          {deposit.verified && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
              ✓ Проверено
            </span>
          )}
        </div>

        {/* Status */}
        <div className="absolute bottom-2 right-2">
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(deposit.status)}`}
          >
            {getStatusText(deposit.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {deposit.title}
          </h3>
          <p className="text-sm text-gray-600">
            {deposit.region}, {deposit.city}
          </p>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {deposit.description}
        </p>

        {/* Occurrence-specific Details */}
        <div className="space-y-2 mb-4">
          {deposit.discoveryDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Дата открытия:</span>
              <span className="font-medium text-gray-900">
                {new Date(deposit.discoveryDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Достоверность:</span>
            <span className="font-medium text-gray-900">
              {getConfidenceText(deposit.geologicalConfidence)}
            </span>
          </div>
          {deposit.estimatedReserves && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Запасы (оценка):</span>
              <span className="font-medium text-gray-900">
                {deposit.estimatedReserves.toLocaleString()} т
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Доступность:</span>
            <span
              className={`font-medium ${getAccessibilityColor(deposit.accessibilityRating)}`}
            >
              {getAccessibilityText(deposit.accessibilityRating)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Минерал:</span>
            <span className="font-medium text-gray-900">{deposit.mineral}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Площадь:</span>
            <span className="font-medium text-gray-900">
              {deposit.area.toLocaleString()} км²
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(deposit.price)}
          </span>
          <span className="text-sm text-gray-500">👁 {deposit.views}</span>
        </div>

        {/* Action Button */}
        <Link
          href={`/listings/${deposit.id}`}
          className="block w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 hover:shadow-md transition-all text-center"
        >
          Подробнее о рудопроявлении
        </Link>
      </div>
    </div>
  );
}
