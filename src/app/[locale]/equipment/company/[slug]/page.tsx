import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import CompanyProfileView from '@/components/equipment/catalog/CompanyProfileView';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';
import {
  COMPANY_PAGE_LOCALE,
  companyCanonicalUrl,
  companyPath,
  equipmentBreadcrumb,
} from '@/lib/seo/equipment-seo';
import { breadcrumbJsonLd } from '@/lib/seo/article-jsonld';
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
    path: companyPath(slug),
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
    // The profile text is the company's own, in Russian: one indexable URL.
    ...(company && {
      canonicalLocale: COMPANY_PAGE_LOCALE,
      languageAlternates: false,
    }),
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
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: companyCanonicalUrl(company.slug),
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
  const breadcrumb = breadcrumbJsonLd([
    ...equipmentBreadcrumb(locale),
    { name: company.name, url: companyCanonicalUrl(company.slug) },
  ]);
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
      {[organization, breadcrumb].map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
