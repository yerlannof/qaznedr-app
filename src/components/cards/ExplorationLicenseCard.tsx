'use client';

import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';

interface ExplorationLicenseCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function ExplorationLicenseCard({
  deposit,
  getStatusColor,
  getStatusText,
}: ExplorationLicenseCardProps) {

  const getExplorationStageText = (stage?: string) => {
    const stages: Record<string, string> = {
      PRELIMINARY: 'Предварительная разведка',
      DETAILED: 'Детальная разведка',
      FEASIBILITY: 'ТЭО',
      ENVIRONMENTAL: 'Экологическая оценка',
    };
    return stages[stage || ''] || 'Не указан';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-[4/3] relative bg-gray-50">
        <div className="absolute inset-0 flex items-center justify-center">
          {(() => {
            const Icon = getMineralIcon(deposit.mineral);
            return <Icon className="w-20 h-20 text-blue-600 opacity-60" />;
          })()}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium">
            🔍 Лицензия на разведку
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {deposit.featured && (
            <span className="bg-gray-600 text-white px-2 py-1 rounded-md text-xs font-medium">
              ⭐ Рекомендуем
            </span>
          )}
          {deposit.verified && (
            <span className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium">
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

        {/* Exploration-specific Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Стадия разведки:</span>
            <span className="font-medium text-gray-900">
              {getExplorationStageText(deposit.explorationStage)}
            </span>
          </div>
          {deposit.explorationPeriod && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Начало работ:</span>
                <span className="font-medium text-gray-900">
                  {new Date(deposit.explorationPeriod.start).toLocaleDateString(
                    'ru-RU'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Окончание:</span>
                <span className="font-medium text-gray-900">
                  {new Date(deposit.explorationPeriod.end).toLocaleDateString(
                    'ru-RU'
                  )}
                </span>
              </div>
            </>
          )}
          {deposit.explorationBudget && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Бюджет:</span>
              <span className="font-medium text-gray-900">
                {(deposit.explorationBudget / 1000000).toFixed(1)} млн ₸
              </span>
            </div>
          )}
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
          <span className="text-2xl font-bold text-green-600">
            {formatPrice(deposit.price)}
          </span>
          <span className="text-sm text-gray-500">👁 {deposit.views}</span>
        </div>

        {/* Action Button */}
        <Link
          href={`/listings/${deposit.id}`}
          className="block w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 hover:shadow-md transition-all text-center"
        >
          Подробнее о разведке
        </Link>
      </div>
    </div>
  );
}
