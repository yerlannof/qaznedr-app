'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatArea } from '@/lib/utils/format';
import { getTypeLabel } from '@/lib/listings/listing-status';
import BaseListingCard from './BaseListingCard';

interface ExplorationLicenseCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
}

export default function ExplorationLicenseCard({
  deposit,
}: ExplorationLicenseCardProps) {
  return (
    <BaseListingCard
      deposit={deposit}
      typeLabel={getTypeLabel('EXPLORATION_LICENSE')}
      meta={<span>{formatArea(deposit.area)}</span>}
    />
  );
}
