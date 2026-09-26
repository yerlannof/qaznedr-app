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
import { HREFLANG, LOCALES, toLocale } from '@/lib/seo/site';

export const dynamic = 'force-static';

// Prerendered at build time, so a missing guide file fails the build
// instead of caching a partial index on the first request.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

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
      <div className="min-h-screen bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <section className="brand-container max-w-[760px] pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-brand-line">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase text-brand-muted">
              {t('insights.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-brand-ink leading-[1.05]">
            {t('insights.title')}
          </h1>
          <p className="mt-6 text-lg text-brand-muted leading-relaxed">
            {t('insights.subtitle')}
          </p>
          {fallback && (
            <p className="mt-4 text-sm text-brand-muted">
              {t('insights.onlyRu')}
            </p>
          )}
        </section>

        <section className="brand-container max-w-[760px] py-14 lg:py-20">
          <ul className="space-y-5">
            {cards.map((card) => (
              <li key={card.slug}>
                <Link
                  href={`/${card.locale}/insights/${card.slug}`}
                  lang={
                    card.locale === locale ? undefined : HREFLANG[card.locale]
                  }
                  className="brand-focus block border border-brand-line bg-brand-surface p-5 sm:p-6 transition-colors hover:bg-brand-bg"
                >
                  <span className="text-xs font-semibold uppercase text-brand-muted">
                    {t(`insights.categories.${card.category}`)}
                  </span>
                  <h2 className="mt-3 font-serif text-2xl tracking-tight text-brand-ink">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-base text-brand-muted leading-relaxed">
                    {card.description}
                  </p>
                  <p className="mt-4 text-sm text-brand-muted">
                    {t('insights.updated')}{' '}
                    {formatCheckDate(card.updated, locale)} ·{' '}
                    {t('insights.readingTime', { n: card.readingMinutes })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ClosingCta locale={locale} variant="brand" />
      </div>
      <Footer />
    </>
  );
}
