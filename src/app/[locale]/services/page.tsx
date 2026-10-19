import Navigation from '@/components/layouts/Navigation';
import PageHero from '@/components/home/PageHero';
import { SCENES } from '@/lib/brand/photos';
import Footer from '@/components/layouts/Footer';
import GuideLinks from '@/components/features/GuideLinks';
import ClosingCta from '@/components/features/ClosingCta';
import HoldingServices, {
  ServiceSchemas,
} from '@/components/features/HoldingServices';
import { getServerTranslation } from '@/lib/i18n/translations';
import { SERVICE_TOPICS } from '@/lib/services/topics';
import { toLocale } from '@/lib/seo/site';
import { getGuideSlug } from '@/lib/insights/contact-context';

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const guideSlug = getGuideSlug((await searchParams)?.guide);
  const { t } = getServerTranslation(locale);
  return (
    <>
      <ServiceSchemas
        locale={locale}
        path="/services"
        topics={SERVICE_TOPICS}
      />
      <Navigation guideSlug={guideSlug} overlay />
      <PageHero
        locale={locale}
        src={SCENES.mapDesk}
        eyebrow={t('navigation.services')}
        title={t('services.hero.title')}
        lede={t('homeV2.servicesTitle')}
        label={t('homeV2.illustration')}
      />
      <div className="bg-brand-bg text-brand-ink">
        <section className="brand-container py-14 lg:py-24">
          <HoldingServices locale={locale} guideSlug={guideSlug} />
        </section>
        <section className="brand-container pb-16 lg:pb-24">
          <GuideLinks locale={locale} heading={t('insights.servicesHeading')} />
        </section>
      </div>
      <ClosingCta locale={locale} variant="brand" guideSlug={guideSlug} />
      <Footer guideSlug={guideSlug} />
    </>
  );
}
