import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import EquipmentCard from '@/components/equipment/catalog/EquipmentCard';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { localeUrl, toLocale } from '@/lib/seo/site';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import { getActiveCompanyBySlug } from '@/lib/equipment-listings/companies';
import {
  activeListingsOfOwner,
  coverImagesFor,
} from '@/lib/equipment-listings/catalog-repository';
import { trustMarksFor } from '@/lib/equipment-listings/moderation-repository';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string; slug: string }> };

const load = async (slug: string) => {
  if (!equipmentCatalogEnabled()) return null;
  return getActiveCompanyBySlug(slug).catch(() => null);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const company = await load(slug);
  return buildPageMetadata({
    locale,
    path: `/equipment/company/${slug}`,
    title: company
      ? translate(locale, 'equipmentCompany.metaTitle', { name: company.name })
      : translate(locale, 'equipmentCatalog.notAvailable'),
    description: company
      ? (company.description?.slice(0, 160) ??
        translate(locale, 'equipmentCompany.metaDescription', {
          name: company.name,
        }))
      : '',
    noindex: !company,
  });
}

export default async function CompanyPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const company = await load(slug);
  if (!company) notFound();
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(locale, `equipmentCompany.${key}`, values);
  const listings = await activeListingsOfOwner(company.ownerId).catch(() => []);
  const ids = listings.map((listing) => listing.id);
  const [covers, markMap] = await Promise.all([
    coverImagesFor(ids).catch(() => ({}) as Record<string, string>),
    trustMarksFor(ids).catch(() => ({})),
  ]);
  const marks = Object.fromEntries(
    Object.entries(markMap).map(([id, rows]) => [
      id,
      (rows as { mark: string }[]).map((row) => row.mark),
    ])
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: localeUrl(locale, `/equipment/company/${company.slug}`),
    ...(company.website && { sameAs: [company.website] }),
    ...(company.description && { description: company.description }),
    ...(company.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: company.city,
        addressCountry: 'KZ',
      },
    }),
  };
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
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
                    cover={(covers as Record<string, string>)[listing.id]}
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
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
