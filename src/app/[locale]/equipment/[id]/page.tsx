import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import EquipmentDetail from '@/components/equipment/catalog/EquipmentDetail';
import { getContactConfig } from '@/lib/config/contacts';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SITE_URL, localeUrl, toLocale, type Locale } from '@/lib/seo/site';
import {
  getActiveListing,
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
import { isServiceCategory } from '@/lib/equipment-listings/taxonomy';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

const enabled = () =>
  process.env.EQUIPMENT_MARKETPLACE_ENABLED === 'true' &&
  process.env.EQUIPMENT_CATALOG_ENABLED === 'true';

async function load(id: string): Promise<PublicEquipmentListing | null> {
  if (!enabled()) return null;
  try {
    return await getActiveListing(id);
  } catch {
    return null;
  }
}

function describe(listing: PublicEquipmentListing, locale: Locale): string {
  return [
    cardTag(listing, locale),
    ...keyFacts(listing, locale),
    placeText(listing, locale),
    priceText(listing, locale),
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 300);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = toLocale(raw);
  const listing = await load(id);
  if (!listing)
    return {
      title: translate(locale, 'equipmentCatalog.notAvailable'),
      robots: { index: false, follow: false },
    };
  return buildPageMetadata({
    locale,
    path: `/equipment/${listing.id}`,
    title: listing.title ?? '',
    description: describe(listing, locale),
  });
}

/**
 * Product for equipment, Service for contractor work. The offer is the
 * advertiser's; QAZNEDR is not named as seller or provider.
 */
function listingJsonLd(
  listing: PublicEquipmentListing,
  locale: Locale,
  images: string[]
) {
  const url = localeUrl(locale, `/equipment/${listing.id}`);
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
  return [
    main,
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
  if (!listing)
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
  const [images, marks] = await Promise.all([
    listImages(listing.id)
      .then((rows) => rows.map((row) => row.id))
      .catch(() => [] as string[]),
    trustMarksFor([listing.id])
      .then((rows) => rows[listing.id] ?? [])
      .catch(() => []),
  ]);
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <EquipmentDetail
          listing={listing}
          locale={locale}
          images={images}
          marks={marks}
          contacts={getContactConfig()}
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
