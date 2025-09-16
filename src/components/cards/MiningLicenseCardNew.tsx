'use client';

import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { getMineralIcon, StatusIcons } from '@/components/icons';
import {
  ShieldCheck,
  Star,
  Eye,
  Calendar,
  MapPin,
  Ruler,
  FileText,
  Factory,
  ArrowRight,
} from 'lucide-react';
import { getPlaceholderImage } from '@/lib/images/placeholders';
import {
  Card,
  CardImage,
  CardBadge,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';

interface MiningLicenseCardProps {
  deposit: KazakhstanDeposit;
  formatPrice: (price: number | null) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function MiningLicenseCardNew({
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

  // Get image URL - use first image from array or placeholder
  const imageUrl =
    deposit.images && Array.isArray(deposit.images) && deposit.images.length > 0
      ? deposit.images[0]
      : getPlaceholderImage(deposit.mineral, deposit.type);

  const MineralIcon = getMineralIcon(deposit.mineral);
  const StatusIcon = StatusIcons[deposit.status] || StatusIcons.default;

  return (
    <Card
      variant="elevated"
      padding="none"
      className="group overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative">
        <CardImage src={imageUrl} alt={deposit.title} aspectRatio="video" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <CardBadge variant="info" className="bg-blue-600 text-white border-0">
            <Factory className="w-3 h-3" />
            Лицензия на добычу
          </CardBadge>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {deposit.featured && (
            <CardBadge
              variant="warning"
              className="bg-gray-600 text-white border-0"
            >
              <Star className="w-3 h-3" fill="currentColor" />
              Рекомендуем
            </CardBadge>
          )}
          {deposit.verified && (
            <CardBadge
              variant="success"
              className="bg-blue-600 text-white border-0"
            >
              <ShieldCheck className="w-3 h-3" />
              Проверено
            </CardBadge>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 right-3">
          <CardBadge className={getStatusColor(deposit.status)}>
            <StatusIcon className="w-3 h-3" />
            {getStatusText(deposit.status)}
          </CardBadge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <CardHeader className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="line-clamp-2 flex-1">
              {deposit.title}
            </CardTitle>
            <MineralIcon className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
          </div>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {deposit.region}, {deposit.city}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm line-clamp-2">
            {deposit.description}
          </p>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 block text-xs mb-1">
                Лицензия №
              </span>
              <span className="font-medium text-gray-900">
                {deposit.licenseNumber || 'Не указан'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs mb-1">Срок до</span>
              <span className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {deposit.licenseExpiry
                  ? new Date(deposit.licenseExpiry).toLocaleDateString('ru-RU')
                  : 'Не указан'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs mb-1">Площадь</span>
              <span className="font-medium text-gray-900 flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                {deposit.area.toLocaleString()} км²
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs mb-1">Минерал</span>
              <span className="font-medium text-gray-900">
                {deposit.mineral}
              </span>
            </div>
          </div>

          {/* Annual Production Limit */}
          {deposit.annualProductionLimit && (
            <div className="pt-3 border-t border-gray-100">
              <span className="text-gray-500 text-xs">
                Годовой лимит добычи
              </span>
              <p className="font-semibold text-gray-900">
                {deposit.annualProductionLimit.toLocaleString()} т/год
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center mt-6">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(deposit.price)}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Eye className="w-3 h-3" />
              {deposit.views} просмотров
            </p>
          </div>

          <Link href={`/listings/${deposit.id}`}>
            <Button
              variant="default"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Подробнее
            </Button>
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}
