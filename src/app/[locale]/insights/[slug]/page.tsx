import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Scale } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ClosingCta from '@/components/features/ClosingCta';
import { getServerTranslation } from '@/lib/i18n/translations';
import { getArticle, listArticles } from '@/lib/insights/content';
import { INSIGHTS, findInsight } from '@/lib/insights/registry';
import { formatCheckDate } from '@/lib/leads/check-date';
import { articleJsonLd } from '@/lib/seo/article-jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';

// Prerendered for the languages each guide is written in; other languages
// are redirected to ru by the middleware. Unknown slugs render notFound()
// (dynamicParams = false would log a NoFallbackError on every such 404).
export function generateStaticParams() {
  return INSIGHTS.flatMap((entry) =>
    entry.locales.map((locale) => ({ locale, slug: entry.slug }))
  );
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article = entry ? getArticle(slug, locale) : null;
  if (!entry || !article) return {};
  return buildPageMetadata({
    locale,
    path: `/insights/${slug}`,
    title: article.title,
    description: article.description,
    locales: entry.locales,
    article: { published: entry.published, modified: entry.updated },
  });
}

export default async function InsightArticlePage({
  params,
}: {
  params: Params;
}) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const entry = findInsight(slug);
  const article = entry ? getArticle(slug, locale) : null;
  if (!entry || !article) notFound();

  const { t } = getServerTranslation(locale);
  // formatCheckDate renders an ISO date per locale (26.09.2026 / 2026年9月26日).
  const updated = formatCheckDate(entry.updated, locale);
  // The legal note dates the rules, not the last text edit.
  const lawAsOf = formatCheckDate(entry.lawAsOf ?? entry.updated, locale);
  const others = listArticles(locale).filter((card) => card.slug !== slug);
  const jsonLd = articleJsonLd({
    slug,
    locale,
    title: article.title,
    description: article.description,
    published: entry.published,
    updated: entry.updated,
  });

  return (
    <>
      {[jsonLd.article, jsonLd.breadcrumb].map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-14 lg:pb-20">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500"
          >
            <Link
              href={`/${locale}`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
            >
              {t('navigation.home')}
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/${locale}/insights`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
            >
              {t('insights.breadcrumb')}
            </Link>
            <span aria-hidden="true">/</span>
            <span
              aria-current="page"
              className="max-w-full truncate text-gray-700 dark:text-gray-300"
            >
              {article.title}
            </span>
          </nav>

          <div className="mt-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              {t(`insights.categories.${entry.category}`)}
            </span>
          </div>
          <h1 className="mt-4 font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.1]">
            {article.title}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {article.description}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('insights.updated')} {updated} ·{' '}
            {t('insights.readingTime', { n: article.readingMinutes })}
          </p>

          {entry.legal && (
            <aside className="mt-8 flex gap-3 rounded-xl border border-gold/40 bg-[rgba(200,162,75,0.05)] p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <Scale
                className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-dark dark:text-gold-light"
                aria-hidden="true"
              />
              <p>{t('insights.legalNote', { date: lawAsOf })}</p>
            </aside>
          )}

          <div
            className="insight-prose mt-10"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </article>

        {others.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
            <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-gray-900 dark:text-gray-50">
              {t('insights.otherGuides')}
            </h2>
            <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
              {others.map((card) => (
                <li key={card.slug}>
                  <Link
                    href={`/${card.locale}/insights/${card.slug}`}
                    className="block py-4 text-base text-gray-900 dark:text-gray-100 hover:text-gold-dark dark:hover:text-gold-light transition-colors duration-150"
                  >
                    {card.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ClosingCta locale={locale} />
      </div>
      <Footer />
    </>
  );
}
