import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, FileText } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import PortalWelcomeHero from '@/components/features/PortalWelcomeHero';
import GeologyScene from '@/components/features/GeologyScene';
import { translate } from '@/lib/i18n/translations';
import { GUIDE } from '@/lib/insights/registry';
import {
  leadMineralName,
  leadRegionName,
  leadSeoText,
} from '@/lib/seo/lead-metadata';
import { INSTAGRAM_URL, type Locale } from '@/lib/seo/site';
import type { HomeSnapshot } from '@/lib/leads/home';
import { formatCheckDate } from '@/lib/leads/check-date';
import { parseShowcase } from '@/lib/leads/showcase';
import ShowcaseHomeTeaser from '@/components/showcase/ShowcaseHomeTeaser';
import ShowcaseDisclaimer from '@/components/showcase/ShowcaseDisclaimer';

export default function HomePageContent({
  locale,
  snapshot,
}: {
  locale: Locale;
  snapshot: HomeSnapshot;
}) {
  const t = (key: string) => translate(locale, key);
  const guideLocale = locale === 'kz' ? 'ru' : locale;
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QAZNEDR HOLDING',
    url: 'https://qaznedr.kz',
    description: t('portal.subtitle'),
    sameAs: [INSTAGRAM_URL],
    areaServed: { '@type': 'Country', name: 'Kazakhstan' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: 'https://qaznedr.kz/en/contact',
      availableLanguage: ['ru', 'kk', 'en', 'zh'],
    },
  };
  const guides = [
    ['foreignInvestor', GUIDE.foreignInvestor],
    ['explorationLicence', GUIDE.explorationLicence],
    ['reserveClassification', GUIDE.reserveClassification],
  ] as const;
  return (
    <div className="holding-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'QAZNEDR HOLDING',
            url: 'https://qaznedr.kz',
            inLanguage: ['ru', 'kk', 'en', 'zh-CN'],
          }),
        }}
      />
      <Navigation />
      <PortalWelcomeHero locale={locale} stats={snapshot.stats} />
      <GeologyScene locale={locale} />
      {snapshot.stats?.total !== 0 && (
        <section className="holding-section" aria-labelledby="home-areas">
          <div className="brand-container">
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <h2 id="home-areas" className="holding-title">
                {t('leadsHero.title')}
              </h2>
              <p className="holding-lead">{t('leadsHero.subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {snapshot.leads.map((lead) => {
                const card = parseShowcase(lead.showcase);
                return card?.featured ? (
                  <ShowcaseHomeTeaser
                    key={lead.code}
                    card={card}
                    locale={locale}
                  />
                ) : (
                  <article
                    key={lead.code}
                    className="border-t border-brand-line pt-6"
                  >
                    <p className="text-sm text-brand-muted">
                      {lead.code} ·{' '}
                      {leadRegionName(lead.region, locale) ||
                        t('leadCard.regionFallback')}
                    </p>
                    <h3 className="font-serif text-3xl mt-4">
                      {leadMineralName(lead.mineral, locale)}
                    </h3>
                    <p className="holding-lead mt-4">
                      {leadSeoText(lead, locale).description}
                    </p>
                    <p className="text-sm text-brand-muted mt-4">
                      {t('leadDetail.verifyDate')}{' '}
                      {formatCheckDate(lead.last_verified, locale)}
                    </p>
                    <Link
                      href={`/${locale}/leads/${lead.code}`}
                      className="inline-flex min-h-12 items-center gap-3 mt-5 font-semibold"
                    >
                      {t('leadCard.open')}
                      <ArrowUpRight aria-hidden className="w-5 h-5" />
                    </Link>
                  </article>
                );
              })}
            </div>
            {snapshot.leads.some((l) => parseShowcase(l.showcase)) && (
              <ShowcaseDisclaimer locale={locale} />
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/leads`}
                className="brand-button-secondary"
              >
                {t('leadsHero.ctaBrowse')}
                <ArrowUpRight aria-hidden className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}
      <section className="holding-section holding-dark">
        <div className="brand-container grid md:grid-cols-2 gap-8">
          <h2 className="holding-title">{t('dealSteps.step3Title')}</h2>
          <div>
            <p className="holding-lead">{t('dealSteps.step3Desc')}</p>
            <Link className="brand-button mt-7" href={`/${locale}/services`}>
              {t('navigation.services')}
              <ArrowUpRight aria-hidden className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      <section className="holding-section">
        <div className="brand-container">
          <h2 className="holding-title">{t('dealSteps.title')}</h2>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="border-t border-brand-line pt-5">
                <span aria-hidden className="font-serif text-3xl">
                  0{n}
                </span>
                <h3 className="text-lg font-semibold mt-5">
                  {t(`dealSteps.step${n}Title`)}
                </h3>
                <p className="text-brand-muted mt-3 leading-relaxed">
                  {t(`dealSteps.step${n}Desc`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="holding-section">
        <div className="brand-container grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <h2 className="holding-title">{t('portal.trust.archiveTitle')}</h2>
            <p className="holding-lead mt-6">{t('holdingCompany.team')}</p>
            <Link
              href={`/${locale}/about`}
              className="brand-button-secondary mt-7"
            >
              {t('navigation.about')}
              <ArrowUpRight aria-hidden className="w-5 h-5" />
            </Link>
          </div>
          <Image
            src="/brand/archive-to-field-960.webp"
            alt=""
            width={960}
            height={640}
            sizes="(max-width:768px) 90vw, 550px"
            className="w-full h-auto"
          />
        </div>
      </section>
      <section className="holding-section">
        <div className="brand-container grid md:grid-cols-3 gap-8">
          {(['verified', 'gates', 'discipline'] as const).map((key) => (
            <div key={key} className="border-t border-brand-line pt-6">
              <h2 className="font-serif text-2xl">
                {t(`portal.trust.${key}Title`)}
              </h2>
              <p className="text-brand-muted leading-relaxed mt-4">
                {t(`portal.trust.${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="holding-section">
        <div className="brand-container">
          <h2 className="holding-title">{t('insights.title')}</h2>
          <div className="mt-10 divide-y divide-brand-line border-y border-brand-line">
            {guides.map(([key, slug]) => (
              <Link
                key={key}
                href={`/${guideLocale}/insights/${slug}`}
                className="grid grid-cols-[24px_1fr_24px] gap-5 items-center py-6"
              >
                <FileText aria-hidden className="w-5 h-5" />
                <span>
                  <span className="block text-lg font-semibold">
                    {t(`insights.links.${key}`)}
                  </span>
                  <span className="block mt-2 text-brand-muted">
                    {t(`insights.summaries.${key}`)}
                  </span>
                </span>
                <ArrowUpRight aria-hidden className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="holding-section holding-dark">
        <div className="brand-container grid md:grid-cols-2 gap-8 items-center">
          <h2 className="holding-title">{t('insights.ctaTitle')}</h2>
          <div>
            <p className="holding-lead">{t('contact.subtitle')}</p>
            <Link href={`/${locale}/contact`} className="brand-button mt-7">
              {t('navigation.contact')}
              <ArrowUpRight aria-hidden className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
