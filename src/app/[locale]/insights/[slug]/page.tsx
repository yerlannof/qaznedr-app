import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Scale } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import GeologicalSupport from '@/components/features/GeologicalSupport';
import ClosingCta from '@/components/features/ClosingCta';
import ArticleToc from '@/components/insights/ArticleToc';
import { getServerTranslation } from '@/lib/i18n/translations';
import { getArticle, listArticles } from '@/lib/insights/content';
import { GUIDE, INSIGHTS, findInsight } from '@/lib/insights/registry';
import { orderRelatedArticles } from '@/lib/insights/related';
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
    ogImagePath: `/insights/${slug}`,
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
  const others = orderRelatedArticles(slug, listArticles(locale));
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
      <Navigation guideSlug={slug} />
      <div className="min-h-screen bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <article className="brand-container max-w-[760px] pt-10 pb-16 lg:pt-14 lg:pb-20">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-brand-muted"
          >
            <Link
              href={`/${locale}`}
              className="brand-focus underline underline-offset-4 decoration-brand-line hover:text-brand-ink"
            >
              {t('navigation.home')}
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              <Link
                href={`/${locale}/insights`}
                className="brand-focus underline underline-offset-4 decoration-brand-line hover:text-brand-ink"
              >
                {t('insights.breadcrumb')}
              </Link>
            </span>
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
              <span aria-hidden="true" className="shrink-0">
                /
              </span>
              <span
                aria-current="page"
                className="max-w-full truncate text-brand-ink"
              >
                {article.title}
              </span>
            </span>
          </nav>

          <div className="mt-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase text-brand-muted">
              {t(`insights.categories.${entry.category}`)}
            </span>
          </div>
          <h1 className="mt-4 font-serif font-light text-4xl lg:text-5xl tracking-tight text-brand-ink leading-[1.1]">
            {article.title}
          </h1>
          <p className="mt-6 text-lg text-brand-muted leading-relaxed">
            {article.description}
          </p>
          <p className="mt-4 text-sm text-brand-muted">
            {t('insights.updated')} {updated} ·{' '}
            {t('insights.readingTime', { n: article.readingMinutes })}
          </p>

          {entry.legal && (
            <aside className="mt-8 flex gap-3 border-l-2 border-brand-accent bg-brand-surface p-5 text-sm text-brand-muted leading-relaxed">
              <Scale
                className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-accent"
                aria-hidden="true"
              />
              <p>{t('insights.legalNote', { date: lawAsOf })}</p>
            </aside>
          )}

          <ArticleToc label={t('insights.contents')} toc={article.toc} />

          <div
            className="insight-prose mt-10 text-base leading-[1.7] md:text-[17px] lg:text-lg"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </article>

        {others.length > 0 && (
          <section className="brand-container max-w-[760px] pb-16 lg:pb-20">
            <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-brand-ink">
              {t('insights.otherGuides')}
            </h2>
            <ul className="mt-6 divide-y divide-brand-line border-y border-brand-line">
              {others.map((card) => (
                <li key={card.slug}>
                  <Link
                    href={`/${card.locale}/insights/${card.slug}`}
                    className="brand-focus block py-4 text-base text-brand-ink underline underline-offset-4 decoration-brand-line hover:text-brand-muted"
                  >
                    {card.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {slug === GUIDE.geologicalMap ? (
          <GeologicalSupport locale={locale} compact guideSlug={slug} />
        ) : (
          <ClosingCta locale={locale} variant="brand" guideSlug={slug} />
        )}
      </div>
      <Footer guideSlug={slug} />
    </>
  );
}
