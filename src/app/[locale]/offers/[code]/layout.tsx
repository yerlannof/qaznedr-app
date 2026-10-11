import type { Metadata } from 'next';
import { translate } from '@/lib/i18n/translations';
import { pickText } from '@/lib/leads/showcase';
import { getOffer } from '@/lib/offers';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, code } = await params;
  const locale = toLocale(rawLocale);
  const offer = getOffer(code);
  if (!offer || offer.status !== 'published') {
    return {
      title: translate(locale, offer ? 'offer.unavailable' : 'offer.notFound'),
      robots: { index: false, follow: false },
    };
  }
  return buildPageMetadata({
    locale,
    path: `/offers/${offer.code}`,
    title: pickText(offer.seo.title, locale).text,
    description: pickText(offer.seo.description, locale).text,
  });
}

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
