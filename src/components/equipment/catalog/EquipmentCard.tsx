import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import { isPeopleCategory } from '@/lib/equipment-listings/taxonomy';
import {
  cardTag,
  intakeLabel,
  keyFacts,
  placeText,
  priceText,
} from '@/lib/equipment-listings/present';

/**
 * Frameless catalogue card (design 21). An offer shows the author's first
 * photo; a request («Ищу») gets a dark block with its budget, a CV or vacancy
 * a light block with an icon, so demand and offers differ at a glance.
 */
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
  const facts = keyFacts(listing, locale).slice(0, 3);
  const tag = cardTag(listing, locale);
  const section = intakeLabel(locale, listing.category);
  const people = isPeopleCategory(listing.category);
  const request = listing.offerType === 'WANTED' && !people;
  const priceLabel =
    listing.offerType === 'WANTED'
      ? translate(
          locale,
          listing.category === 'staff'
            ? 'equipmentIntake.salaryOffered'
            : 'equipmentIntake.budget'
        )
      : null;
  const price = priceText(listing, locale);

  return (
    <Link
      href={href}
      className="group brand-focus flex min-w-0 flex-col text-brand-ink"
    >
      {request ? (
        <div className="flex aspect-[4/3] flex-col justify-between bg-brand-deep p-5 text-brand-chalk">
          <span className="self-start bg-brand-accent px-2.5 py-1 text-xs font-medium text-brand-slate">
            {tag}
          </span>
          <p className="text-[15px] text-brand-chalk/80">
            {priceLabel}
            <b className="mt-1 block text-[28px] font-light leading-tight tracking-[-0.02em] text-brand-chalk">
              {price}
            </b>
          </p>
        </div>
      ) : people ? (
        <div className="flex aspect-[4/3] flex-col justify-between border border-brand-hair bg-brand-surface p-5">
          <span className="self-start bg-brand-ink px-2.5 py-1 text-xs font-medium text-brand-bg">
            {tag}
          </span>
          <UserRound
            aria-hidden
            className="size-14 text-brand-muted"
            strokeWidth={1}
          />
        </div>
      ) : cover ? (
        <div className="photo-tile relative aspect-[4/3]">
          <Image
            src={`/api/equipment-catalog/${listing.id}/images/${cover}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute left-3 top-3 z-[1] bg-brand-chalk px-2.5 py-1 text-xs font-medium text-brand-deep">
            {tag}
          </span>
        </div>
      ) : (
        // No photo: a neutral block of the same size, never an illustration.
        <div className="flex aspect-[4/3] items-start bg-brand-surface p-3">
          <span className="bg-brand-chalk px-2.5 py-1 text-xs font-medium text-brand-deep">
            {tag}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        {/* Service tags already name the section. */}
        {!tag.includes(section) && (
          <p className="text-[13px] text-brand-muted">{section}</p>
        )}
        <h3 className="text-[21px] font-normal leading-snug tracking-[-0.015em] group-hover:underline group-hover:decoration-brand-line group-hover:underline-offset-4">
          {listing.title}
        </h3>
        {facts.length > 0 && (
          <p className="text-sm text-brand-muted">{facts.join(' · ')}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="size-[15px]" strokeWidth={1.6} />
            {placeText(listing, locale)}
          </span>
          {marks.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-brand-ok">
              <ShieldCheck
                aria-hidden
                className="size-[15px]"
                strokeWidth={1.6}
              />
              {marks
                .map((mark) =>
                  translate(locale, `equipmentCatalog.trust_${mark}`, {
                    date: '',
                  }).trim()
                )
                .join(' · ')}
            </span>
          )}
        </div>
        <p className="mt-auto flex items-center justify-between gap-3 border-t border-brand-hair pt-3 text-[19px] font-medium">
          <span>
            {!request && priceLabel && (
              <span className="mr-1.5 text-[13px] font-normal text-brand-muted">
                {priceLabel}:
              </span>
            )}
            {request ? (
              <span className="text-[15px] font-normal">
                {translate(locale, 'equipmentCatalog.details')}
              </span>
            ) : (
              price
            )}
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-5 shrink-0 text-brand-accent"
            strokeWidth={1.5}
          />
        </p>
      </div>
    </Link>
  );
}
