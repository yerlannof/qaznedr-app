'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gavel, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardImage, CardBadge } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button-new';
import { getPlaceholderImage } from '@/lib/images/placeholders';
import { cn } from '@/lib/utils';

interface AuctionCardProps {
  auction: {
    id: string;
    deposit_id: string;
    start_date: string;
    end_date: string;
    starting_price: number;
    current_price: number | null;
    reserve_price: number | null;
    buy_now_price: number | null;
    bid_increment: number;
    status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
    winner_id: string | null;
    deposit: {
      id: string;
      title: string;
      description: string;
      mineral: string;
      region: string;
      city: string;
      area: number;
      images: any;
      verified: boolean;
    };
    bids_count?: number;
    time_left?: string;
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState(auction.time_left || '');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(auction.end_date);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Завершен');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Mark as urgent if less than 1 hour left
      setUrgent(diff < 1000 * 60 * 60);

      if (days > 0) {
        setTimeLeft(`${days} дн. ${hours} ч.`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} ч. ${minutes} мин.`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes} мин. ${seconds} сек.`);
      } else {
        setTimeLeft(`${seconds} сек.`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.end_date]);

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} млрд ₸`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн ₸`;
    } else {
      return `${price.toLocaleString()} ₸`;
    }
  };

  const currentPrice = auction.current_price || auction.starting_price;
  const priceIncrease = auction.current_price
    ? Number(
        (
          ((auction.current_price - auction.starting_price) /
            auction.starting_price) *
          100
        ).toFixed(0)
      )
    : 0;

  const imageUrl =
    auction.deposit.images &&
    Array.isArray(auction.deposit.images) &&
    auction.deposit.images.length > 0
      ? auction.deposit.images[0]
      : getPlaceholderImage(auction.deposit.mineral, 'MINING_LICENSE');

  const isActive = auction.status === 'ACTIVE';
  const isEnded = auction.status === 'ENDED';
  const hasReserve =
    auction.reserve_price && currentPrice < auction.reserve_price;

  return (
    <Card
      variant="elevated"
      padding="none"
      className="group overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative">
        <CardImage
          src={imageUrl}
          alt={auction.deposit.title}
          aspectRatio="video"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {isActive && (
            <CardBadge
              variant="success"
              className="bg-green-600 text-white border-0"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
              Активный аукцион
            </CardBadge>
          )}
          {isEnded && (
            <CardBadge
              variant="default"
              className="bg-gray-600 text-white border-0"
            >
              Завершен
            </CardBadge>
          )}
        </div>

        {/* Time Badge */}
        {isActive && (
          <div className="absolute top-3 right-3">
            <CardBadge
              variant={urgent ? 'error' : 'default'}
              className={cn(
                'text-white border-0',
                urgent ? 'bg-red-600 animate-pulse' : 'bg-gray-900/80'
              )}
            >
              <Clock className="w-3 h-3" />
              {timeLeft}
            </CardBadge>
          </div>
        )}

        {/* Buy Now Badge */}
        {auction.buy_now_price && isActive && (
          <div className="absolute bottom-3 left-3">
            <CardBadge
              variant="warning"
              className="bg-yellow-500 text-white border-0"
            >
              Купить сейчас: {formatPrice(auction.buy_now_price)}
            </CardBadge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {auction.deposit.title}
        </h3>

        {/* Location */}
        <p className="text-sm text-gray-600 mb-4">
          {auction.deposit.region}, {auction.deposit.city} •{' '}
          {auction.deposit.area} км²
        </p>

        {/* Price Section */}
        <div className="space-y-3 mb-4">
          {/* Current Price */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Текущая ставка</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(currentPrice)}
              </p>
              {priceIncrease > 0 && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+{priceIncrease}%
                </span>
              )}
            </div>
          </div>

          {/* Starting Price */}
          {auction.current_price && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Начальная цена:</span>
              <span className="text-gray-700">
                {formatPrice(auction.starting_price)}
              </span>
            </div>
          )}

          {/* Reserve Warning */}
          {hasReserve && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 rounded-lg p-2">
              <AlertCircle className="w-4 h-4" />
              <span>Резервная цена не достигнута</span>
            </div>
          )}

          {/* Bid Info */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Ставок:
            </span>
            <span className="font-medium">{auction.bids_count || 0}</span>
          </div>

          {/* Next Bid */}
          {isActive && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Мин. ставка:</span>
              <span className="font-medium text-gray-900">
                {formatPrice(currentPrice + auction.bid_increment)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isActive ? (
            <>
              <Link href={`/auctions/${auction.id}`} className="flex-1">
                <Button
                  variant="default"
                  className="w-full"
                  leftIcon={<Gavel className="w-4 h-4" />}
                >
                  Сделать ставку
                </Button>
              </Link>
              {auction.buy_now_price && (
                <Link href={`/auctions/${auction.id}?buyNow=true`}>
                  <Button variant="outline">Купить</Button>
                </Link>
              )}
            </>
          ) : (
            <Link href={`/auctions/${auction.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Посмотреть результаты
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
