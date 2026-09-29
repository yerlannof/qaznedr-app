import BrandContour from '@/components/features/BrandContour';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import GuideLinks from '@/components/features/GuideLinks';
import ClosingCta from '@/components/features/ClosingCta';
import HoldingServices, {
  ServiceSchemas,
} from '@/components/features/HoldingServices';
import { getServerTranslation } from '@/lib/i18n/translations';
import { SERVICE_TOPICS } from '@/lib/services/topics';
import { toLocale } from '@/lib/seo/site';

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const { t } = getServerTranslation(locale);
  return (
    <>
      <ServiceSchemas
        locale={locale}
        path="/services"
        topics={SERVICE_TOPICS}
      />
      <Navigation />
      <div className="min-h-screen bg-brand-bg pt-14 text-brand-ink lg:pt-16">
        <header className="brand-container grid items-center gap-8 border-b border-brand-line py-12 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-7">
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              {t('services.hero.title')}
            </h1>
          </div>
          <div className="brand-services-motif lg:col-span-5">
            <BrandContour variant="services" className="w-full h-auto" />
          </div>
        </header>
        <section className="brand-container py-12 lg:py-20">
          <HoldingServices locale={locale} />
        </section>
        <section className="brand-container pb-16 lg:pb-24">
          <GuideLinks locale={locale} heading={t('insights.servicesHeading')} />
        </section>
      </div>
      <ClosingCta locale={locale} variant="brand" />
      <Footer />
    </>
  );
}
