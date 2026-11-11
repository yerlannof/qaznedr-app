import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ownerOfActiveListing } from '@/lib/equipment-listings/engagement';
import { activeCompanyOf } from '@/lib/equipment-listings/companies';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import EquipmentDetail from '@/components/equipment/catalog/EquipmentDetail';
import ViewBeacon from '@/components/equipment/catalog/ViewBeacon';
import { getContactConfig } from '@/lib/config/contacts';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SITE_URL, localeUrl, toLocale, type Locale } from '@/lib/seo/site';
import {
  appendExcerpt,
  listingCanonicalUrl,
  listingPath,
  listingSourceLocale,
} from '@/lib/seo/equipment-seo';
import {
  getActiveListing,
  listingExists,
  type PublicEquipmentListing,
} from '@/lib/equipment-listings/catalog-repository';
import { listImages } from '@/lib/equipment-listings/image-repository';
import { trustMarksFor } from '@/lib/equipment-listings/moderation-repository';
import {
  cardTag,
  keyFacts,
  placeText,
  priceText,
  specRows,
} from '@/lib/equipment-listings/present';
import {
  isPeopleCategory,
  isServiceCategory,
} from '@/lib/equipment-listings/taxonomy';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

const enabled = equipmentCatalogEnabled;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The published listing; 'withdrawn' for one that exists but is not active
 * (archived, rejected, back in moderation); null for an address that never
 * held a listing, which answers 404.
 */
async function load(
  id: string
): Promise<PublicEquipmentListing | 'withdrawn' | null> {
  if (!enabled() || !UUID.test(id)) return null;
  try {
    const listing = await getActiveListing(id);
    if (listing) return listing;
    return (await listingExists(id)) ? 'withdrawn' : null;
  } catch {
    // A failed read does not prove the listing never existed: no 404.
    return 'withdrawn';
  }
}

function describe(listing: PublicEquipmentListing, locale: Locale): string {
  const facts = [
    cardTag(listing, locale),
    ...keyFacts(listing, locale),
    placeText(listing, locale),
    priceText(listing, locale),
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 300);
  return appendExcerpt(facts, listing.description);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = toLocale(raw);
  const listing = await load(id);
  if (!listing) notFound();
  if (listing === 'withdrawn')
    return {
      title: translate(locale, 'equipmentCatalog.notAvailable'),
      robots: { index: false, follow: false },
    };
  // The author's text is not translated: only the URL in its language is
  // indexable, and no hreflang presents the other three as translations.
  return buildPageMetadata({
    locale,
    path: listingPath(listing.id),
    title: listing.title ?? '',
    description: describe(listing, locale),
    canonicalLocale: listingSourceLocale(listing),
    languageAlternates: false,
  });
}

/**
 * Service for contractor work; Product for equipment only when it carries a
 * price, since Google treats a Product without an offer, review or rating as
 * invalid. The offer is the advertiser's; QAZNEDR is not named as seller or
 * provider. Nothing goes in that the page does not show (no rating or
 * availability).
 */
function listingJsonLd(
  listing: PublicEquipmentListing,
  locale: Locale,
  images: string[]
) {
  const url = listingCanonicalUrl(listing);
  const offer =
    listing.price !== undefined && listing.currency
      ? {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: listing.currency,
          url,
          ...(listing.priceUnit && {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: listing.price,
              priceCurrency: listing.currency,
              unitText: listing.priceUnit,
            },
          }),
        }
      : undefined;
  const common = {
    '@context': 'https://schema.org',
    name: listing.title,
    description: describe(listing, locale),
    url,
    ...(images.length && {
      image: images
        .slice(0, 3)
        .map(
          (image) =>
            `${SITE_URL}/api/equipment-catalog/${listing.id}/images/${image}`
        ),
    }),
    ...(offer && { offers: offer }),
  };
  const main = isServiceCategory(listing.category)
    ? {
        ...common,
        '@type': 'Service',
        serviceType: cardTag(listing, locale),
        areaServed: { '@type': 'Country', name: 'Kazakhstan' },
      }
    : {
        ...common,
        '@type': 'Product',
        category: cardTag(listing, locale),
        ...(listing.brand && {
          brand: { '@type': 'Brand', name: listing.brand },
        }),
        ...(listing.model && { model: listing.model }),
        additionalProperty: specRows(listing, locale).map((row) => ({
          '@type': 'PropertyValue',
          name: row.label,
          value: row.value,
        })),
      };
  // Requests and people are not products or services on offer.
  const describable =
    listing.offerType !== 'WANTED' &&
    !isPeopleCategory(listing.category) &&
    (isServiceCategory(listing.category) || offer !== undefined);
  return [
    ...(describable ? [main] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: translate(locale, 'navigation.home'),
          item: localeUrl(locale),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: translate(locale, 'equipmentCatalog.eyebrow'),
          item: localeUrl(locale, '/equipment'),
        },
        { '@type': 'ListItem', position: 3, name: listing.title, item: url },
      ],
    },
  ];
}

export default async function EquipmentListingPage({ params }: Props) {
  if (!enabled()) notFound();
  const { locale: raw, id } = await params;
  const locale = toLocale(raw);
  const listing = await load(id);
  if (!listing) notFound();
  if (listing === 'withdrawn')
    return (
      <>
        <Navigation />
        <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
          <div className="brand-container py-16">
            <h1 className="holding-title">
              {translate(locale, 'equipmentCatalog.notAvailable')}
            </h1>
            <Link
              href={`/${locale}/equipment`}
              className="brand-button brand-focus mt-8"
            >
              {translate(locale, 'equipmentCatalog.backToCatalog')}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  const [images, marks, company] = await Promise.all([
    listImages(listing.id)
      .then((rows) => rows.map((row) => row.id))
      .catch(() => [] as string[]),
    trustMarksFor([listing.id])
      .then((rows) => rows[listing.id] ?? [])
      .catch(() => []),
    ownerOfActiveListing(listing.id)
      .then((owner) => (owner ? activeCompanyOf(owner.ownerId) : null))
      .catch(() => null),
  ]);
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        {/* Views are counted in the browser: once per session, no automation. */}
        <ViewBeacon listingId={listing.id} />
        <EquipmentDetail
          listing={listing}
          locale={locale}
          images={images}
          marks={marks}
          contacts={getContactConfig()}
          company={company && { name: company.name, slug: company.slug }}
        />
      </main>
      <Footer />
      {listingJsonLd(listing, locale, images).map((data, index) => (
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
