import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import CompanyProfileView from '@/components/equipment/catalog/CompanyProfileView';
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
      <Navigation overlay />
      <main className="bg-brand-bg text-brand-ink">
        <CompanyProfileView
          locale={locale}
          company={company}
          listings={listings}
          covers={covers as Record<string, string>}
          marks={marks}
        />
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
