import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ProspectingCard from '@/components/prospecting/ProspectingCard';
import ViewToggle from '@/components/catalog/ViewToggle';
import { ProspectingGridCard } from '@/components/catalog/GridCards';
import { getContactConfig } from '@/lib/config/contacts';
import { GUIDE, insightHref } from '@/lib/insights/registry';
import { listPublicPlots } from '@/lib/prospecting/plots';
import { PROSPECTING_PATH, plotPath } from '@/lib/prospecting/present';
import { getServerTranslation } from '@/lib/i18n/translations';
import { breadcrumbJsonLd } from '@/lib/seo/article-jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { HREFLANG, LOCALES, localeUrl, toLocale } from '@/lib/seo/site';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  return buildPageMetadata({
    locale,
    path: PROSPECTING_PATH,
    title: t('prospecting.seoIndexTitle'),
    description: t('prospecting.seoIndexDescription'),
  });
}

export default async function ProspectingIndexPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = toLocale((await params).locale);
  const view = (await searchParams)?.view === 'list' ? 'list' : 'grid';
  const { t } = getServerTranslation(locale);
  const plots = listPublicPlots();
  const contacts = getContactConfig();
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('prospecting.indexTitle'),
      url: localeUrl(locale, PROSPECTING_PATH),
      inLanguage: HREFLANG[locale],
      description: t('prospecting.seoIndexDescription'),
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: plots.map((plot, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: localeUrl(locale, plotPath(plot.code)),
        })),
      },
    },
    breadcrumbJsonLd([
      { name: t('navigation.home'), url: localeUrl(locale) },
      {
        name: t('prospecting.breadcrumb'),
        url: localeUrl(locale, PROSPECTING_PATH),
      },
    ]),
  ];
  return (
    <>
      <Navigation />
      <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <div className="brand-container pb-12 lg:pb-20">
          <header className="border-b border-brand-line py-10 lg:py-14">
            <p className="text-sm text-brand-muted">
              {t('prospecting.kind')} ·{' '}
              {t('prospecting.indexCount', { count: plots.length })}
            </p>
            <h1 className="holding-title mt-4 max-w-4xl">
              {t('prospecting.indexTitle')}
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-brand-muted">
              {t('prospecting.indexLead')}
            </p>
            <Link
              href={insightHref(locale, GUIDE.artisanalMining)}
              className="brand-focus mt-5 flex min-h-11 items-center gap-3 underline underline-offset-4"
            >
              <BookOpen aria-hidden className="size-4 shrink-0" />
              {t('prospecting.guideLink')}
            </Link>
            <Link
              href={`/${locale}/leads?kind=prospecting`}
              className="brand-focus mt-1 flex min-h-11 items-center gap-3 underline underline-offset-4"
            >
              <ArrowRight aria-hidden className="size-4 shrink-0" />
              {t('prospecting.catalogLink')}
            </Link>
          </header>
          <div className="flex justify-end border-b border-brand-line py-3">
            <ViewToggle
              locale={locale}
              view={view}
              gridHref={`/${locale}${PROSPECTING_PATH}`}
              listHref={`/${locale}${PROSPECTING_PATH}?view=list`}
            />
          </div>
          {view === 'grid' ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plots.map((plot) => (
                <ProspectingGridCard
                  key={plot.code}
                  plot={plot}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            plots.map((plot) => (
              <ProspectingCard
                key={plot.code}
                plot={plot}
                locale={locale}
                contacts={contacts}
              />
            ))
          )}
          <p className="mt-8 max-w-3xl text-sm text-brand-muted">
            <strong className="text-brand-ink">
              {t('prospecting.disclaimerLabel')}
            </strong>{' '}
            {t('prospecting.disclaimer')}
          </p>
        </div>
      </div>
      <Footer />
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
