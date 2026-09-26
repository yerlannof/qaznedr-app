import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import { getServerTranslation } from '@/lib/i18n/translations';
import { listArticles } from '@/lib/insights/content';
import { formatCheckDate } from '@/lib/leads/check-date';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, insightsBreadcrumb } from '@/lib/seo/article-jsonld';
import { HREFLANG, toLocale } from '@/lib/seo/site';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/insights', 'insights');
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const cards = listArticles(locale);
  const fallback = cards.some((card) => card.locale !== locale);
  const breadcrumb = breadcrumbJsonLd(insightsBreadcrumb(locale));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t('insights.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            {t('insights.title')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('insights.subtitle')}
          </p>
          {fallback && (
            <p className="mt-4 text-sm text-gray-500">{t('insights.onlyRu')}</p>
          )}
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <ul className="space-y-5">
            {cards.map((card) => (
              <li key={card.slug}>
                <Link
                  href={`/${card.locale}/insights/${card.slug}`}
                  lang={
                    card.locale === locale ? undefined : HREFLANG[card.locale]
                  }
                  className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6 shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
                    {t(`insights.categories.${card.category}`)}
                  </span>
                  <h2 className="mt-3 font-serif text-2xl tracking-tight text-gray-900 dark:text-gray-50">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                  <p className="mt-4 text-sm text-gray-500">
                    {t('insights.updated')}{' '}
                    {formatCheckDate(card.updated, locale)} ·{' '}
                    {t('insights.readingTime', { n: card.readingMinutes })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
