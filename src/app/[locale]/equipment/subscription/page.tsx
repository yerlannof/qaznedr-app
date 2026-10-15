import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import SubscriptionAction from '@/components/equipment/SubscriptionAction';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  return {
    ...buildPageMetadata({
      locale,
      path: '/equipment/subscription',
      title: translate(locale, 'equipmentSubscribe.pageTitle'),
      description: translate(locale, 'equipmentSubscribe.text'),
      noindex: true,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function SubscriptionPage({ params }: Props) {
  if (!equipmentCatalogEnabled()) notFound();
  const locale = toLocale((await params).locale);
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <SubscriptionAction locale={locale} />
      </main>
      <Footer />
    </>
  );
}
