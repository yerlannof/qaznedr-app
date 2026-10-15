import Link from 'next/link';
import { ExternalLink, MapPin } from 'lucide-react';
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
    <div className="brand-container py-10 lg:py-14">
      <Link
        href={`/${locale}/equipment`}
        className="brand-focus text-sm text-brand-muted underline"
      >
        {translate(locale, 'equipmentCatalog.backToCatalog')}
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {t('eyebrow')}
      </p>
      <h1 className="holding-title mt-3">{company.name}</h1>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-brand-muted">
        {company.city && (
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            {company.city}
          </span>
        )}
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="brand-focus inline-flex items-center gap-2 underline"
          >
            <ExternalLink aria-hidden className="size-4" />
            {company.website.replace(/^https:\/\//, '')}
          </a>
        )}
      </div>
      {company.description && (
        <p className="mt-6 max-w-3xl whitespace-pre-line">
          {company.description}
        </p>
      )}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          {t('listings', { count: listings.length })}
        </h2>
        {listings.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="mt-4 text-brand-muted">{t('empty')}</p>
        )}
      </section>
      <p className="mt-12 max-w-3xl border-t border-brand-line pt-6 text-sm text-brand-muted">
        {translate(locale, 'equipmentCatalog.disclaimer')}
      </p>
    </div>
  );
}
