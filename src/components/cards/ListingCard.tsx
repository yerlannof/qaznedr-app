'use client';

import { KazakhstanDeposit } from '@/lib/types/listing';
import MiningLicenseCard from './MiningLicenseCard';
import ExplorationLicenseCard from './ExplorationLicenseCard';
import MineralOccurrenceCard from './MineralOccurrenceCard';

interface ListingCardProps {
  deposit: KazakhstanDeposit;
}

export default function ListingCard({ deposit }: ListingCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';

    if (price >= 1000000000000) {
      return `${(price / 1000000000000).toFixed(1)} трлн ₸`;
    } else if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} млрд ₸`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн ₸`;
    } else {
      return `${price.toLocaleString()} ₸`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-gray-100 text-gray-800';
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
      return <MiningLicenseCard {...cardProps} />;
    case 'EXPLORATION_LICENSE':
      return <ExplorationLicenseCard {...cardProps} />;
    case 'MINERAL_OCCURRENCE':
      return <MineralOccurrenceCard {...cardProps} />;
    default:
      // Fallback to mining license card for unknown types
      return <MiningLicenseCard {...cardProps} />;
  }
}
