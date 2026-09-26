'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatArea } from '@/lib/utils/format';
import { getTypeLabel } from '@/lib/listings/listing-status';
import { Calendar } from 'lucide-react';
import BaseListingCard from './BaseListingCard';

interface MiningLicenseCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
  onAddToComparison?: (deposit: KazakhstanDeposit) => void;
  onRemoveFromComparison?: (id: string) => void;
  isInComparison?: boolean;
}

export default function MiningLicenseCard({ deposit }: MiningLicenseCardProps) {
  return (
    <BaseListingCard
      deposit={deposit}
      typeLabel={getTypeLabel('MINING_LICENSE')}
      meta={
        <>
          <span>{formatArea(deposit.area)}</span>
          {deposit.licenseExpiry && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              до{' '}
              {new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </>
      }
    />
  );
}
