import Link from 'next/link';
import { ArrowLeft, Globe, MapPin } from 'lucide-react';
import EquipmentCard from './EquipmentCard';
import { translate } from '@/lib/i18n/translations';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';

export type CompanyView = {
  name: string;
  description: string | null;
  website: string | null;
  city: string | null;
};

export default function CompanyProfileView({
  locale,
  company,
  listings,
  covers,
  marks,
}: {
  locale: string;
  company: CompanyView;
  listings: PublicEquipmentListing[];
  covers: Record<string, string>;
  marks: Record<string, string[]>;
}) {
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(locale, `equipmentCompany.${key}`, values);
  return (
    <>
      {/* Dark band under the transparent header (design 21). */}
      <header className="photo-band">
        <div className="brand-container grid gap-3.5 pb-12 pt-[120px]">
          <Link
            href={`/${locale}/equipment`}
            className="brand-focus inline-flex min-h-11 items-center gap-1.5 text-sm text-brand-chalk/75"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {translate(locale, 'equipmentCatalog.backToCatalog')}
          </Link>
          <p className="holding-eyebrow text-brand-chalk/70">{t('eyebrow')}</p>
          <h1 className="text-[34px] font-light leading-[1.04] tracking-[-0.025em] md:text-[56px]">
            {company.name}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-brand-chalk/80">
            {company.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="size-[15px]" strokeWidth={1.6} />
                {company.city}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="brand-focus inline-flex items-center gap-1.5 underline underline-offset-4"
              >
                <Globe aria-hidden className="size-[15px]" strokeWidth={1.6} />
                {company.website.replace(/^https:\/\//, '')}
              </a>
            )}
          </div>
          {company.description && (
            <p className="max-w-[60ch] whitespace-pre-line text-brand-chalk/85">
              {company.description}
            </p>
          )}
        </div>
      </header>
      <div className="brand-container">
        <section className="py-14 md:py-20">
          <h2 className="mb-7 text-[28px] font-light leading-[1.1] tracking-[-0.025em] md:text-[44px]">
            {t('listings', { count: listings.length })}
          </h2>
          {listings.length ? (
            <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <EquipmentCard
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  cover={covers[listing.id]}
                  marks={marks[listing.id] ?? []}
                />
              ))}
            </div>
          ) : (
            <p className="text-brand-muted">{t('empty')}</p>
          )}
        </section>
        <p className="max-w-[72ch] pb-14 text-[13px] text-brand-muted">
          {translate(locale, 'equipmentCatalog.disclaimer')}
        </p>
      </div>
    </>
  );
}
