import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import GuideLinks from '@/components/features/GuideLinks';
import GeologicalSupport from '@/components/features/GeologicalSupport';
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
    '/services/geological',
    'servicesGeological'
  );
}

export default async function GeologicalServicesPage({
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
        path="/services/geological"
        topics={['geology']}
      />
      <Navigation serviceTopic="geology" />
      <div className="min-h-screen bg-brand-bg pt-14 text-brand-ink lg:pt-16">
        <article className="brand-container py-12 lg:py-20">
          <Link
            href={`/${locale}/services`}
            className="brand-focus inline-flex min-h-11 items-center text-sm text-brand-muted underline underline-offset-4"
          >
            {t('navigation.services')}
          </Link>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
            {t('holdingServices.geology.title')}
          </h1>
          <div className="mt-10">
            <ServiceDetail locale={locale} topic="geology" />
          </div>
        </article>
        <GeologicalSupport locale={locale} />
        <section className="brand-container pb-16 lg:pb-24">
          <GuideLinks locale={locale} heading={t('insights.servicesHeading')} />
        </section>
      </div>
      <ClosingCta locale={locale} variant="brand" serviceTopic="geology" />
      <Footer />
    </>
  );
}
