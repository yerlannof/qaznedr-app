'use client';

import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { getMineralIcon } from '@/components/icons';
import { ShieldCheck, Star, Eye, MapPin, Factory } from 'lucide-react';

interface MiningLicenseCardProps {
  deposit: KazakhstanDeposit;
  formatPrice: (price: number | null) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function MiningLicenseCard({
  deposit,
  formatPrice,
  getStatusColor,
  getStatusText,
}: MiningLicenseCardProps) {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-[4/3] relative bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="absolute inset-0 flex items-center justify-center">
          {(() => {
            const Icon = getMineralIcon(deposit.mineral);
            return <Icon className="w-16 h-16 text-blue-600 opacity-80" />;
          })()}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Factory className="w-3 h-3" />
            Лицензия на добычу
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {deposit.featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" fill="currentColor" />
              Рекомендуем
            </span>
          )}
          {deposit.verified && (
            <span className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Проверено
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
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {deposit.region}, {deposit.city}
          </p>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {deposit.description}
        </p>

        {/* License-specific Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Лицензия №:</span>
            <span className="font-medium text-gray-900">
              {deposit.licenseNumber || 'Не указан'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Подтип:</span>
            <span className="font-medium text-gray-900">
              {getLicenseSubtypeText(deposit.licenseSubtype)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Срок действия:</span>
            <span className="font-medium text-gray-900">
              {deposit.licenseExpiry
                ? new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU')
                : 'Не указан'}
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
          {deposit.annualProductionLimit && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Лимит добычи:</span>
              <span className="font-medium text-gray-900">
                {deposit.annualProductionLimit.toLocaleString()} т/год
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(deposit.price)}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {deposit.views}
          </span>
        </div>

        {/* Action Button */}
        <Link
          href={`/listings/${deposit.id}`}
          className="block w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 hover:shadow-md transition-all text-center"
        >
          Подробнее о лицензии
        </Link>
      </div>
    </div>
  );
}
