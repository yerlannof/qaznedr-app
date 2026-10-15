import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import {
  cardTag,
  keyFacts,
  placeText,
  priceText,
} from '@/lib/equipment-listings/present';

export default function EquipmentCard({
  listing,
  locale,
  cover,
  marks,
}: {
  listing: PublicEquipmentListing;
  locale: string;
  cover?: string;
  marks: string[];
}) {
  const href = `/${locale}/equipment/${listing.id}`;
  const facts = keyFacts(listing, locale);
  return (
    <article className="flex flex-col border border-brand-line bg-brand-surface">
      <div
        className={`relative bg-brand-bg ${cover ? 'aspect-[4/3]' : 'h-24'}`}
      >
        {cover && (
          <Image
            src={`/api/equipment-catalog/${listing.id}/images/${cover}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        <span className="absolute left-4 top-4 border border-brand-ink bg-brand-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide">
          {cardTag(listing, locale)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold leading-snug">
          <Link href={href} className="brand-focus hover:underline">
            {listing.title}
          </Link>
        </h3>
        {facts.length > 0 && (
          <p className="text-sm text-brand-muted">{facts.join(' · ')}</p>
        )}
        <p className="text-sm text-brand-muted">{placeText(listing, locale)}</p>
        {marks.length > 0 && (
          <p className="flex items-center gap-1 text-sm">
            <ShieldCheck aria-hidden className="size-4" />
            {marks
              .map((mark) =>
                translate(locale, `equipmentCatalog.trust_${mark}`, {
                  date: '',
                }).trim()
              )
              .join(' · ')}
          </p>
        )}
        <p className="mt-auto pt-3 text-lg font-semibold">
          {listing.offerType === 'WANTED' &&
            `${translate(
              locale,
              listing.category === 'staff'
                ? 'equipmentIntake.salaryOffered'
                : 'equipmentIntake.budget'
            )}: `}
          {priceText(listing, locale)}
        </p>
        <Link
          href={href}
          className="brand-button-secondary brand-focus mt-2 w-full justify-center"
        >
          {translate(locale, 'equipmentCatalog.details')}
        </Link>
      </div>
    </article>
  );
}
