'use client';

import Link from 'next/link';
import { MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  service_type: string;
  provider_name: string;
  provider_phone: string | null;
  provider_email: string | null;
  region: string;
  city: string | null;
  price_range: string | null;
  website: string | null;
  verified: boolean;
  created_at: string;
}

const SERVICE_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  drilling: { label: 'Буровые работы', emoji: '\uD83D\uDD29' },
  consulting: { label: 'Консалтинг', emoji: '\uD83D\uDCA1' },
  audit: { label: 'Аудит', emoji: '\uD83D\uDCCB' },
  legal: { label: 'Юридические услуги', emoji: '\u2696\uFE0F' },
  lab: { label: 'Лабораторные анализы', emoji: '\uD83D\uDD2C' },
  reserve_estimation: { label: 'Оценка запасов', emoji: '\uD83D\uDCCA' },
  equipment: { label: 'Оборудование', emoji: '\u2699\uFE0F' },
  other: { label: 'Другое', emoji: '\uD83D\uDCE6' },
};

export function getServiceTypeLabel(type: string): string {
  return SERVICE_TYPE_CONFIG[type]?.label || type;
}

export function getServiceTypeEmoji(type: string): string {
  return SERVICE_TYPE_CONFIG[type]?.emoji || '\uD83D\uDCE6';
}

interface ServiceCardProps {
  service: ServiceItem;
  locale?: string;
}

export default function ServiceCard({
  service,
  locale = 'ru',
}: ServiceCardProps) {
  const config =
    SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.other;
  const truncatedDesc = service.description
    ? service.description.length > 120
      ? service.description.slice(0, 120) + '...'
      : service.description
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="p-5 flex-1">
        {/* Header: badge + verified */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </span>
          {service.verified && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Проверено</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2">
          {service.title}
        </h3>

        {/* Description */}
        {truncatedDesc && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
            {truncatedDesc}
          </p>
        )}

        {/* Provider */}
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          {service.provider_name}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {service.city
              ? `${service.city}, ${service.region}`
              : service.region}
          </span>
        </div>

        {/* Price range */}
        {service.price_range && (
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {service.price_range}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        {service.website ? (
          <a
            href={service.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Сайт
          </a>
        ) : (
          <span />
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(service.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>
    </div>
  );
}
