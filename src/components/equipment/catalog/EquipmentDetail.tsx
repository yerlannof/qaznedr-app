import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';
import ContactBeacon from './ContactBeacon';
import ResponseForm from './ResponseForm';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';
import {
  cardTag,
  formatDate,
  placeText,
  priceText,
  specRows,
  workAreaText,
} from '@/lib/equipment-listings/present';
import { localeUrl, toLocale } from '@/lib/seo/site';

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
  return (
    <article className="brand-container py-10 lg:py-14">
      <Link
        href={`/${locale}/equipment`}
        className="brand-focus text-sm text-brand-muted hover:underline"
      >
        {t('backToCatalog')}
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {cardTag(listing, locale)}
      </p>
      <h1 className="holding-title mt-3">{title}</h1>
      <p className="mt-3 text-brand-muted">{placeText(listing, locale)}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-8">
          {images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image, index) => (
                <div
                  key={image}
                  className={`relative aspect-[4/3] bg-brand-surface ${index === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <Image
                    src={`/api/equipment-catalog/${listing.id}/images/${image}`}
                    alt={t('photo', { n: index + 1 }) + ` — ${title}`}
                    fill
                    sizes={
                      index === 0
                        ? '(min-width: 1024px) 760px, 100vw'
                        : '(min-width: 1024px) 380px, 50vw'
                    }
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          )}
          {listing.description && (
            <section>
              <h2 className="text-xl font-semibold">{t('description')}</h2>
              <p className="mt-3 whitespace-pre-line">{listing.description}</p>
            </section>
          )}
          <section>
            <h2 className="text-xl font-semibold">{t('specs')}</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[14rem_1fr]">
              {specRows(listing, locale).map((row, index) => (
                <div key={index} className="contents">
                  <dt className="text-brand-muted">{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              {workArea && (
                <div className="contents">
                  <dt className="text-brand-muted">{t('workArea')}</dt>
                  <dd>{workArea}</dd>
                </div>
              )}
            </dl>
          </section>
          {listing.conditions && (
            <section>
              <h2 className="text-xl font-semibold">{t('conditions')}</h2>
              <p className="mt-3 whitespace-pre-line">{listing.conditions}</p>
            </section>
          )}
        </div>

        {/* On phones the price and contact come first; on desktop they sit in the side column. */}
        <aside className="order-first space-y-6 border border-brand-line bg-brand-surface p-6 lg:order-none">
          <div>
            {listing.offerType === 'WANTED' && (
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-muted">
                {translate(
                  locale,
                  listing.category === 'staff'
                    ? 'equipmentIntake.salaryOffered'
                    : 'equipmentIntake.budget'
                )}
              </p>
            )}
            <p className="text-2xl font-semibold">
              {priceText(listing, locale)}
            </p>
          </div>
          <ContactBeacon listingId={listing.id}>
            <section>
              <h2 className="font-semibold">{t('contactTitle')}</h2>
              {ownerPhone ? (
                <div className="mt-3 space-y-3">
                  <p>
                    {[listing.contactName, listing.company]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <a
                    data-contact
                    href={`tel:${ownerPhone.replace(/[^\d+]/g, '')}`}
                    className="brand-button brand-focus w-full justify-center"
                  >
                    <Phone aria-hidden className="size-4" />
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
                    className="brand-button-secondary brand-focus w-full justify-center"
                  >
                    <MessageCircle aria-hidden className="size-4" />
                    {t('whatsappOwner')}
                  </a>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
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
                      className="brand-button brand-focus w-full justify-center"
                    >
                      <MessageCircle aria-hidden className="size-4" />
                      {t('contactTeam')}
                    </a>
                  )}
                </div>
              )}
            </section>
          </ContactBeacon>
          {company && (
            <Link
              href={`/${locale}/equipment/company/${company.slug}`}
              className="brand-focus block text-sm font-semibold underline"
            >
              {translate(locale, 'equipmentCompany.allListings', {
                name: company.name,
              })}
            </Link>
          )}
          {listing.offerType === 'WANTED' && (
            <ResponseForm listingId={listing.id} locale={locale} />
          )}
          <section>
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck aria-hidden className="size-4" />
              {t('trustTitle')}
            </h2>
            {marks.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {marks.map((row) => (
                  <li key={row.mark}>
                    {t(`trust_${row.mark}`, {
                      date: formatDate(row.setAt, locale),
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-muted">{t('trustNone')}</p>
            )}
          </section>
          <p className="text-sm text-brand-muted">
            {t('updated', { date: formatDate(listing.updatedAt, locale) })}
          </p>
          {contacts.whatsappNumber && (
            <a
              href={whatsappLink(
                contacts.whatsappNumber,
                t('reportMessage', { url })
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-focus block text-sm text-brand-muted underline"
            >
              {t('report')}
            </a>
          )}
        </aside>
      </div>
      <p className="mt-12 max-w-3xl border-t border-brand-line pt-6 text-sm text-brand-muted">
        {t('disclaimer')}
      </p>
    </article>
  );
}
