import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';
import ContactBeacon from './ContactBeacon';
import ResponseForm from './ResponseForm';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import {
  cardTag,
  formatDate,
  intakeLabel,
  placeText,
  priceText,
  specRows,
  workAreaText,
} from '@/lib/equipment-listings/present';
import { localeUrl, toLocale } from '@/lib/seo/site';

const blockTitle = 'mb-3 text-2xl font-normal tracking-[-0.015em]';

/**
 * Listing page (design 21). Phones show price, contact, company and the
 * editorial checks first (rule of 16.10); desktop keeps them in a sticky
 * right column.
 */
export default function EquipmentDetail({
  listing,
  locale,
  images,
  marks,
  contacts,
  company = null,
}: {
  listing: PublicEquipmentListing;
  locale: string;
  images: string[];
  marks: { mark: string; setAt: string }[];
  contacts: ContactConfig;
  company?: { name: string; slug: string } | null;
}) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, `equipmentCatalog.${key}`, params);
  const url = localeUrl(toLocale(locale), `/equipment/${listing.id}`);
  const title = listing.title ?? '';
  const workArea = workAreaText(listing, locale);
  const ownerPhone =
    listing.phone && listing.phone.replace(/\D/g, '').length >= 7
      ? listing.phone
      : null;
  const capabilityLabel = intakeLabel(locale, 'capabilities');
  const rows = specRows(listing, locale);
  const capabilities = rows.filter((row) => row.label === capabilityLabel);
  const specs = rows.filter((row) => row.label !== capabilityLabel);
  if (workArea) specs.push({ label: t('workArea'), value: workArea });
  const wanted = listing.offerType === 'WANTED';
  const photo = (image: string) =>
    `/api/equipment-catalog/${listing.id}/images/${image}`;

  return (
    <article className="brand-container">
      <header className="grid gap-3.5 pb-7 pt-4 md:pb-9 md:pt-10">
        <Link
          href={`/${locale}/equipment`}
          className="brand-focus inline-flex min-h-11 items-center gap-1.5 text-sm text-brand-muted"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t('backToCatalog')}
        </Link>
        <p className="holding-eyebrow text-brand-muted">
          {cardTag(listing, locale)}
        </p>
        <h1 className="max-w-[24ch] text-[32px] font-light leading-[1.06] tracking-[-0.025em] md:text-[52px]">
          {title}
        </h1>
        <p className="flex items-center gap-1.5 text-[13px] text-brand-muted">
          <MapPin aria-hidden className="size-[15px]" strokeWidth={1.6} />
          {placeText(listing, locale)}
        </p>
      </header>

      <div className="grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <aside className="grid content-start gap-5 lg:sticky lg:top-[84px] lg:order-2 lg:self-start">
          <div className="grid gap-1">
            {wanted && (
              <span className="text-sm text-brand-muted">
                {translate(
                  locale,
                  listing.category === 'staff'
                    ? 'equipmentIntake.salaryOffered'
                    : 'equipmentIntake.budget'
                )}
              </span>
            )}
            <b className="text-[28px] font-normal leading-tight tracking-[-0.02em] tabular-nums md:text-4xl">
              {priceText(listing, locale)}
            </b>
          </div>
          {(listing.contactName || listing.company) && (
            <div className="flex items-center gap-3 border-y border-brand-hair py-4">
              <span className="grid size-11 flex-none place-items-center rounded-full bg-brand-surface">
                {listing.company ? (
                  <Building2
                    aria-hidden
                    className="size-[22px] text-brand-muted"
                    strokeWidth={1.4}
                  />
                ) : (
                  <UserRound
                    aria-hidden
                    className="size-[22px] text-brand-muted"
                    strokeWidth={1.4}
                  />
                )}
              </span>
              <p className="min-w-0 text-[15px] leading-snug">
                {[listing.contactName, listing.company]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )}
          {wanted && <ResponseForm listingId={listing.id} locale={locale} />}
          <ContactBeacon listingId={listing.id}>
            <section aria-label={t('contactTitle')} className="grid gap-2">
              {ownerPhone ? (
                <>
                  <a
                    data-contact
                    href={`tel:${ownerPhone.replace(/[^\d+]/g, '')}`}
                    className={`${wanted ? 'brand-button-secondary' : 'brand-button'} brand-focus w-full tabular-nums`}
                  >
                    <Phone aria-hidden className="size-[18px]" />
                    {t('call')} {ownerPhone}
                  </a>
                  <a
                    data-contact
                    href={whatsappLink(
                      ownerPhone.replace(/\D/g, ''),
                      t('ownerMessage', { title })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-button-secondary brand-focus w-full"
                  >
                    <MessageCircle aria-hidden className="size-[18px]" />
                    {t('whatsappOwner')}
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm text-brand-muted">
                    {t('contactHidden')}
                  </p>
                  {contacts.whatsappNumber && (
                    <a
                      data-contact
                      href={whatsappLink(
                        contacts.whatsappNumber,
                        t('teamMessage', { title, url })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${wanted ? 'brand-button-secondary' : 'brand-button'} brand-focus w-full`}
                    >
                      <MessageCircle aria-hidden className="size-[18px]" />
                      {t('contactTeam')}
                    </a>
                  )}
                </>
              )}
            </section>
          </ContactBeacon>
          {company && (
            <Link
              href={`/${locale}/equipment/company/${company.slug}`}
              className="brand-focus text-[15px] underline decoration-brand-line underline-offset-4"
            >
              {translate(locale, 'equipmentCompany.allListings', {
                name: company.name,
              })}
              <ArrowRight aria-hidden className="ml-1.5 inline size-4" />
            </Link>
          )}
          <section className="grid gap-3">
            <h2 className="holding-eyebrow text-brand-muted">
              {t('trustTitle')}
            </h2>
            {marks.length ? (
              <ul className="grid gap-2.5">
                {marks.map((row) => (
                  <li
                    key={row.mark}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <ShieldCheck
                      aria-hidden
                      className="size-[18px] flex-none text-brand-ok"
                      strokeWidth={1.6}
                    />
                    {t(`trust_${row.mark}`, { date: '' }).trim()}
                    <time
                      dateTime={row.setAt}
                      className="ml-auto whitespace-nowrap text-[13px] text-brand-muted"
                    >
                      {formatDate(row.setAt, locale)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-muted">{t('trustNone')}</p>
            )}
          </section>
          <p className="text-[13px] text-brand-muted">
            {t('updated', { date: formatDate(listing.updatedAt, locale) })}
            {contacts.whatsappNumber && (
              <>
                {' · '}
                <a
                  href={whatsappLink(
                    contacts.whatsappNumber,
                    t('reportMessage', { url })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-focus underline underline-offset-4"
                >
                  {t('report')}
                </a>
              </>
            )}
          </p>
        </aside>

        <div className="grid min-w-0 content-start gap-10">
          {images.length > 0 && (
            <div className="grid gap-2">
              <div className="relative aspect-[3/2] bg-brand-surface">
                <Image
                  src={photo(images[0])}
                  alt={t('photo', { n: 1 }) + ` — ${title}`}
                  fill
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-cover"
                  priority
                />
                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-brand-deep/70 px-2.5 py-1 text-xs tabular-nums text-brand-chalk">
                    1 / {images.length}
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1).map((image, index) => (
                    <a
                      key={image}
                      href={photo(image)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brand-focus relative block aspect-square bg-brand-surface"
                    >
                      <Image
                        src={photo(image)}
                        alt={t('photo', { n: index + 2 }) + ` — ${title}`}
                        fill
                        sizes="(min-width: 1024px) 180px, 25vw"
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {listing.description && (
            <section>
              <h2 className={blockTitle}>{t('description')}</h2>
              <p className="max-w-[64ch] whitespace-pre-line">
                {listing.description}
              </p>
            </section>
          )}
          <section>
            <h2 className={blockTitle}>{t('specs')}</h2>
            {capabilities.length > 0 && (
              <div className="mb-3 grid gap-2">
                {capabilities.map((row, index) => (
                  <div
                    key={index}
                    className="bg-brand-surface px-3.5 py-3 text-[15px] tabular-nums"
                  >
                    {row.value}
                  </div>
                ))}
              </div>
            )}
            <dl>
              {specs.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(120px,40%)_1fr] gap-3 border-b border-brand-hair py-3 text-[15px]"
                >
                  <dt className="text-brand-muted">{row.label}</dt>
                  <dd className="min-w-0">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {listing.conditions && (
            <section>
              <h2 className={blockTitle}>{t('conditions')}</h2>
              <p className="max-w-[64ch] whitespace-pre-line">
                {listing.conditions}
              </p>
            </section>
          )}
        </div>
      </div>
      <p className="max-w-[72ch] pb-14 text-[13px] text-brand-muted">
        {t('disclaimer')}
      </p>
    </article>
  );
}
