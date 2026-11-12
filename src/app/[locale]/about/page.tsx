import type { Metadata } from 'next';
import PageHero from '@/components/home/PageHero';
import { SCENES } from '@/lib/brand/photos';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import DealSteps from '@/components/features/DealSteps';
import ClosingCta from '@/components/features/ClosingCta';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { getServerTranslation } from '@/lib/i18n/translations';
import {
  LOCALES,
  SITE_NAME,
  SITE_URL,
  INSTAGRAM_URL,
  localeUrl,
  toLocale,
} from '@/lib/seo/site';
import { breadcrumbJsonLd } from '@/lib/seo/article-jsonld';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/about', 'about');
}

// No cookies, query or database: prerender per locale (static HTML).
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
// English-only "Technology" block (approved 12.11.2026 for the AWS Activate application).
const TECHNOLOGY_EN = {
  title: 'Technology',
  paragraphs: [
    "QAZNEDR builds an AI knowledge base of Kazakhstan's geological archive. We digitize Soviet-era exploration reports (over 7,000 reports and 1.3 million scanned pages processed so far), read them with OCR and large language models, and extract the facts that matter: commodity, grades, sampling results and the exact page they come from. Every figure is checked against the original scan before it is used.",
    'The result is a map-based registry of mineral occurrences across Kazakhstan, which our geologists use to answer desk-study questions in days instead of months — for investors, licence applicants and holders.',
  ],
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const { t } = getServerTranslation(locale);
  const organization = {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    sameAs: [INSTAGRAM_URL],
  };
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: t('holdingCompany.title'),
      url: localeUrl(locale, '/about'),
      mainEntity: organization,
    },
    breadcrumbJsonLd([
      { name: t('navigation.home'), url: localeUrl(locale) },
      { name: t('navigation.about'), url: localeUrl(locale, '/about') },
    ]),
  ];
  return (
    <>
      <Navigation overlay />
      <PageHero
        locale={locale}
        src={SCENES.geologists}
        eyebrow={t('navigation.about')}
        title={t('holdingCompany.title')}
        lede={t('holdingCompany.intro')}
        label={t('homeV2.illustration')}
        position="center 30%"
      />
      <div className="bg-brand-bg text-brand-ink">
        <section className="brand-container py-14 lg:py-24">
          <h2 className="font-serif text-3xl lg:text-4xl">
            {t('holdingCompany.what')}
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {['areas', 'deal', 'geology'].map((key, i) => (
              <div key={key} className="border-t border-brand-line pt-5">
                <p className="text-sm text-brand-muted">0{i + 1}</p>
                <p className="mt-4 leading-relaxed">
                  {t(`holdingCompany.${key}`)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 border-y border-brand-line py-8 md:flex md:items-start md:gap-12">
            <div>
              <p className="font-serif text-5xl">7 152</p>
              <p className="mt-3 text-sm text-brand-muted">
                {t('portal.statsRegistryLabel')}
              </p>
            </div>
            <p className="mt-6 max-w-2xl leading-relaxed text-brand-muted md:mt-0">
              {t('portal.statsCaption')}
            </p>
          </div>
        </section>
        {locale === 'en' && (
          <section
            id="technology"
            className="brand-container border-t border-brand-line py-14 lg:py-20"
          >
            <h2 className="font-serif text-3xl lg:text-4xl">
              {TECHNOLOGY_EN.title}
            </h2>
            <div className="mt-8 grid max-w-3xl gap-5">
              {TECHNOLOGY_EN.paragraphs.map((text) => (
                <p key={text.slice(0, 24)} className="leading-relaxed">
                  {text}
                </p>
              ))}
            </div>
          </section>
        )}
        <DealSteps locale={locale} />
        <section className="brand-container py-12 lg:py-20">
          <h2 className="font-serif text-3xl">{t('holdingCompany.start')}</h2>
          <nav className="mt-8 grid divide-y divide-brand-line border-y border-brand-line">
            {[
              ['/leads', 'navigation.leads'],
              ['/contact', 'footerNav.info.contacts'],
              ['/faq', 'footerNav.info.faq'],
            ].map(([path, key]) => (
              <Link
                key={path}
                href={`/${locale}${path}`}
                className="brand-focus flex min-h-16 items-center justify-between gap-5 py-5 text-lg"
              >
                {t(key)}
                <ArrowUpRight className="size-5 shrink-0" aria-hidden />
              </Link>
            ))}
          </nav>
        </section>
        <ClosingCta locale={locale} variant="brand" />
      </div>
      <Footer />
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
