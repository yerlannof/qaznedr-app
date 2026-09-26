'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { KazakhstanDeposit } from '@/lib/types/listing';
import { formatPrice, formatShortDate } from '@/lib/utils/format';
import { getMineralIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { getStatusMeta } from '@/lib/listings/listing-status';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ShowInterestButton from './ShowInterestButton';

interface BaseListingCardProps {
  deposit: KazakhstanDeposit;
  /** Localized listing-type eyebrow, e.g. "Лицензия на разведку". */
  typeLabel: string;
  /** Optional secondary meta row (area, license expiry, reserves…). */
  meta?: ReactNode;
}

/**
 * Shared editorial card shell for every listing type. Owns the brand language
 * (gold accents, serif title + price), the equal-height layout, the
 * locale-prefixed link, and — critically — keeps the interactive
 * ShowInterestButton OUTSIDE the <Link> so the markup is valid and the tap
 * targets are unambiguous.
 */
export default function BaseListingCard({
  deposit,
  typeLabel,
  meta,
}: BaseListingCardProps) {
  const { locale } = useTranslation();
  const MineralIcon = getMineralIcon(deposit.mineral);
  const status = getStatusMeta(deposit.status);
  const href = `/${locale}/listings/${deposit.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-medium dark:border-gray-700 dark:bg-[#141414] dark:hover:border-gold/50">
      <Link
        href={href}
        className="flex flex-1 flex-col rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        {/* Header medallion */}
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#0f0f0f]">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-subtle transition-transform duration-200 group-hover:scale-105 dark:bg-[#141414]">
            <MineralIcon
              className="h-10 w-10 text-gold-dark dark:text-gold-light"
              aria-hidden="true"
            />
          </div>

          <div className="absolute right-3 top-3 flex gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            {deposit.verified && (
              <Badge variant="gold">
                <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                Проверено
              </Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md border border-gray-200/60 bg-white/95 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur dark:border-gray-700/60 dark:bg-[#141414]/95 dark:text-gray-200">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {deposit.region}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {typeLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[rgba(200,162,75,0.25)] bg-[rgba(200,162,75,0.12)] px-2 py-0.5 text-xs font-medium text-gold-dark dark:text-gold-light">
              {deposit.mineral}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-1 font-serif text-lg text-gray-900 dark:text-gray-50">
            {deposit.title}
          </h3>

          {meta && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              {meta}
            </div>
          )}

          <div className="mt-auto flex items-baseline justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
            <span className="font-serif text-2xl tabular-nums text-gold-dark dark:text-gold-light">
              {formatPrice(deposit.price)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatShortDate(deposit.createdAt)}
            </span>
          </div>
        </div>
      </Link>

      {/* Action footer — sibling of the link, not nested inside it */}
      <div className="flex justify-end px-4 pb-4">
        <ShowInterestButton
          listingId={deposit.id}
          sellerId={(deposit as any).user_id}
        />
      </div>
    </article>
  );
}
