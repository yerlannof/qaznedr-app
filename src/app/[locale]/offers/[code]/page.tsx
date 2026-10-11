import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import OfferDetail from '@/components/offers/OfferDetail';
import { getContactConfig } from '@/lib/config/contacts';
import { getServerTranslation, translate } from '@/lib/i18n/translations';
import { pickText } from '@/lib/leads/showcase';
import { getOffer, listPublishedOffers } from '@/lib/offers';
import type { AssetOffer } from '@/lib/offers/contract';
import { SITE_URL, localeUrl, toLocale, type Locale } from '@/lib/seo/site';

export function generateStaticParams() {
  return listPublishedOffers().map((o) => ({ code: o.code }));
}

/**
 * A Place with its published parameters — not a Product/Offer: no price is
 * published and the holding does not own the asset.
 */
function offerJsonLd(offer: AssetOffer, locale: Locale) {
  const url = localeUrl(locale, `/offers/${offer.code}`);
  const name = pickText(offer.seo.title, locale).text;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name,
      description: pickText(offer.seo.description, locale).text,
      url,
      image: offer.images.slice(0, 3).map((i) => `${SITE_URL}${i.url}`),
      containedInPlace: { '@type': 'Country', name: 'Kazakhstan' },
      additionalProperty: offer.facts_table.map((row) => ({
        '@type': 'PropertyValue',
        name: pickText(row.label, locale).text,
        value: pickText(row.value, locale).text,
      })),
      ...(offer.video && {
        subjectOf: {
          '@type': 'VideoObject',
          name,
          description: pickText(offer.video.caption, locale).text,
          thumbnailUrl: `${SITE_URL}${offer.video.poster}`,
          contentUrl: `${SITE_URL}${offer.video.url}`,
          uploadDate: offer.published_at,
          duration: `PT${offer.video.duration_s}S`,
        },
      }),
    },
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
          name: translate(locale, 'navigation.leads'),
          item: localeUrl(locale, '/leads'),
        },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    },
  ];
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: raw, code } = await params;
  const locale = toLocale(raw);
  const offer = getOffer(code);
  if (!offer) notFound();
  if (offer.status !== 'published') {
    // Withdrawn or sold: a neutral notice on the old address, no reason given.
    const { t } = getServerTranslation(locale);
    return (
      <>
        <Navigation />
        <div className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
          <div className="brand-container py-16">
            <h1 className="holding-title">{t('offer.unavailable')}</h1>
            <Link
              href={`/${locale}/leads`}
              className="brand-button brand-focus mt-8"
            >
              {t('navigation.leads')}
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Navigation />
      <div className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <OfferDetail
          offer={offer}
          locale={locale}
          contacts={getContactConfig()}
        />
      </div>
      <Footer />
      {offerJsonLd(offer, locale).map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
