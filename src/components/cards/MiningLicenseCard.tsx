'use client';

import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ShieldCheck } from 'lucide-react';
import ShowInterestButton from './ShowInterestButton';

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
        <div className="h-48 bg-gray-50 dark:bg-gray-800 overflow-hidden relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#141414] shadow-subtle flex items-center justify-center">
            <MineralIcon className="w-10 h-10 text-[#0A84FF]" />
          </div>

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

          {/* Region pill bottom-left */}
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 dark:bg-[#141414]/95 backdrop-blur text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60">
            <MapPin className="w-3 h-3" />
            {deposit.region}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Лицензия на добычу
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-medium">
              {deposit.mineral}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-1.5 line-clamp-1">
            {deposit.title}
          </h3>

          {/* Key info row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{deposit.area.toLocaleString()} км²</span>
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
          <div className="mt-3 flex justify-end">
            <ShowInterestButton
              listingId={deposit.id}
              sellerId={(deposit as any).user_id}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
