import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import OwnerCabinet from '@/components/equipment/OwnerCabinet';
import { getContactConfig } from '@/lib/config/contacts';
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
      path: '/equipment/my',
      title: translate(locale, 'equipmentCabinet.metaTitle'),
      description: translate(locale, 'equipmentCabinet.metaDescription'),
      noindex: true,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function OwnerCabinetPage({ params }: Props) {
  if (
    process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true' ||
    process.env.EQUIPMENT_INTAKE_ENABLED !== 'true'
  )
    notFound();
  const locale = toLocale((await params).locale);
  const googleEnabled = Boolean(
    process.env.MARKETPLACE_IDENTITY_ENABLED === 'true' &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
  );
  return (
    <>
      <Navigation />
      <main className="bg-brand-bg pt-20 text-brand-ink lg:pt-24">
        <OwnerCabinet
          locale={locale}
          googleEnabled={googleEnabled}
          whatsappNumber={getContactConfig().whatsappNumber}
        />
      </main>
      <Footer />
    </>
  );
}
