'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatArea } from '@/lib/utils/format';
import { getTypeLabel } from '@/lib/listings/listing-status';
import BaseListingCard from './BaseListingCard';

interface MineralOccurrenceCardProps {
  deposit: KazakhstanDeposit;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
}

export default function MineralOccurrenceCard({
  deposit,
}: MineralOccurrenceCardProps) {
  return (
    <BaseListingCard
      deposit={deposit}
      typeLabel={getTypeLabel('MINERAL_OCCURRENCE')}
      meta={<span>{formatArea(deposit.area)}</span>}
    />
  );
}
