'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice } from '@/lib/utils/format';
import MiningLicenseCardNew from './MiningLicenseCardNew';
import ExplorationLicenseCard from './ExplorationLicenseCard';
import MineralOccurrenceCard from './MineralOccurrenceCard';

interface ListingCardProps {
  deposit: KazakhstanDeposit;
}

export default function ListingCard({ deposit }: ListingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-700';
      case 'SOLD':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активно';
      case 'PENDING':
        return 'В ожидании';
      case 'SOLD':
        return 'Продано';
      default:
        return status;
    }
  };

  const cardProps = {
    deposit,
    formatPrice,
    getStatusColor,
    getStatusText,
  };

  switch (deposit.type) {
    case 'MINING_LICENSE':
      return <MiningLicenseCardNew {...cardProps} />;
    case 'EXPLORATION_LICENSE':
      return <ExplorationLicenseCard {...cardProps} />;
    case 'MINERAL_OCCURRENCE':
      return <MineralOccurrenceCard {...cardProps} />;
    default:
      // Fallback to mining license card for unknown types
      return <MiningLicenseCardNew {...cardProps} />;
  }
}
