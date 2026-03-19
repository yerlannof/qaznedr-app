'use client';

import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ShieldCheck } from 'lucide-react';

interface MiningLicenseCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onAddToComparison?: (deposit: KazakhstanDeposit) => void;
  onRemoveFromComparison?: (id: string) => void;
  isInComparison?: boolean;
}

export default function MiningLicenseCard({
  deposit,
  getStatusText,
}: MiningLicenseCardProps) {
  const statusVariant = (() => {
    switch (deposit.status) {
      case 'ACTIVE':
        return 'success' as const;
      case 'PENDING':
        return 'warning' as const;
      case 'SOLD':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  })();

  const formattedDate = deposit.createdAt
    ? new Date(deposit.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  const MineralIcon = getMineralIcon(deposit.mineral);

  return (
    <Link href={`/listings/${deposit.id}`}>
      <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] shadow-subtle hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Image */}
        <div className="h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden relative flex items-center justify-center">
          <MineralIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />

          {/* Status badge top-right */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge variant={statusVariant}>
              {getStatusText(deposit.status)}
            </Badge>
            {deposit.verified && (
              <Badge variant="blue">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Проверено
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Горнодобывающая лицензия
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-1 line-clamp-1">
            {deposit.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {deposit.region}
          </p>

          {/* Key info row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{deposit.area.toLocaleString()} km²</span>
            {deposit.licenseExpiry && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                до{' '}
                {new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {formatPrice(deposit.price)}
            </span>
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
