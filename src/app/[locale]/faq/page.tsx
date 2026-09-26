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
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t('faqPage.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            {t('faqPage.title')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('faqPage.subtitle')}
          </p>
        </section>

        {/* Q&A */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map(({ q, a }) => (
              <div key={q} className="py-8 first:pt-0 last:pb-0">
                <h2 className="font-serif text-2xl text-gray-900 dark:text-gray-50 tracking-tight mb-3">
                  {q}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Guides */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
          <GuideLinks locale={locale} heading={t('insights.faqHeading')} />
        </div>

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
