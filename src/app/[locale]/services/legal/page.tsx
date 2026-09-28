import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import GuideLinks from '@/components/features/GuideLinks';
import ClosingCta from '@/components/features/ClosingCta';
import {
  ServiceDetail,
  ServiceSchemas,
} from '@/components/features/HoldingServices';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  return buildTranslatedPageMetadata(
    locale,
    '/services/legal',
    'servicesLegal'
  );
}

export default async function LegalServicesPage({
  params,
}: {
  params: Params;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const { t } = getServerTranslation(locale);
  return (
    <>
      <ServiceSchemas
        locale={locale}
        path="/services/legal"
        topics={['licensing']}
      />
      <Navigation serviceTopic="licensing" />
      <div className="min-h-screen bg-brand-bg pt-14 text-brand-ink lg:pt-16">
        <article className="brand-container py-12 lg:py-20">
          <Link
            href={`/${locale}/services`}
            className="brand-focus inline-flex min-h-11 items-center text-sm text-brand-muted underline underline-offset-4"
          >
            {t('navigation.services')}
          </Link>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
            {t('holdingServices.licensing.title')}
          </h1>
          <div className="mt-10">
            <ServiceDetail locale={locale} topic="licensing" />
          </div>
        </article>
        <section className="brand-container pb-16 lg:pb-24">
          <GuideLinks
            locale={locale}
            heading={t('insights.servicesHeading')}
            keys={[
              'foreignInvestor',
              'explorationLicence',
              'rightsTransfer',
              'artisanalMining',
              'pugfn',
            ]}
          />
        </section>
      </div>
      <ClosingCta locale={locale} variant="brand" serviceTopic="licensing" />
      <Footer />
    </>
  );
}
