import type { Metadata } from 'next';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import GuideLinks from '@/components/features/GuideLinks';
import { faqFor, faqJsonLd } from '@/lib/content/faq';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/faq', 'faq');
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const items = faqFor(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(items)).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />
      <div className="min-h-screen bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        {/* Hero */}
        <section className="brand-container max-w-[760px] pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-brand-line">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase text-brand-muted">
              {t('faqPage.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-brand-ink leading-[1.05]">
            {t('faqPage.title')}
          </h1>
          <p className="mt-6 text-lg text-brand-muted leading-relaxed">
            {t('faqPage.subtitle')}
          </p>
        </section>

        {/* Q&A */}
        <section className="brand-container max-w-[760px] py-14 lg:py-20">
          <div className="divide-y divide-brand-line">
            {items.map(({ q, a }) => (
              <div
                key={q}
                lang={locale === 'kz' ? 'ru' : locale}
                className="py-8 first:pt-0 last:pb-0"
              >
                <h2 className="font-serif text-2xl text-brand-ink tracking-tight mb-3">
                  {q}
                </h2>
                <p className="text-base text-brand-muted leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Guides */}
        <div className="brand-container max-w-[760px] pb-16 lg:pb-20">
          <GuideLinks locale={locale} heading={t('insights.faqHeading')} />
        </div>

        <ClosingCta locale={locale} variant="brand" />
      </div>
      <Footer />
    </>
  );
}
