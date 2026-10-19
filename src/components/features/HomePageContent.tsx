import Link from 'next/link';
import { keepWords } from '@/lib/i18n/keep-words';
import { ArrowUpRight, FileText } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import HomeHero from '@/components/home/HomeHero';
import HomeMinerals from '@/components/home/HomeMinerals';
import HomeServices from '@/components/home/HomeServices';
import PhotoBand from '@/components/home/PhotoBand';
import { SCENES } from '@/lib/brand/photos';
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
import Image from 'next/image';
import { SPECIMENS } from '@/lib/brand/photos';
import {
  OfferGridCard,
  ProspectingGridCard,
  ShowcaseGridCard,
} from '@/components/catalog/GridCards';
import { listPublishedOffers } from '@/lib/offers';
import { listPublicPlots } from '@/lib/prospecting/plots';
import ShowcaseDisclaimer from '@/components/showcase/ShowcaseDisclaimer';

export default function HomePageContent({
  locale,
  snapshot,
}: {
  locale: Locale;
  snapshot: HomeSnapshot;
}) {
  const t = (key: string) => translate(locale, key);
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
  // Home grid (redesign 20): two cards plus a tile into the coal finds keep
  // the 3-column grid full. Featured finds keep their one chosen caveat.
  const HOME_CARDS = 2;
  const coalCount = snapshot.coal;
  // One published offer first, then the geobase's featured finds, then plots.
  const offers = listPublishedOffers().slice(0, 1);
  const featured = snapshot.leads
    .filter((l) => parseShowcase(l.showcase)?.featured)
    .slice(0, Math.max(0, HOME_CARDS - offers.length));
  const legacyLeads = snapshot.leads
    .filter((l) => !parseShowcase(l.showcase))
    .slice(0, Math.max(0, HOME_CARDS - offers.length - featured.length));
  const plots = listPublicPlots().slice(
    0,
    Math.max(
      0,
      HOME_CARDS - offers.length - featured.length - legacyLeads.length
    )
  );
  const hasCards =
    offers.length + featured.length + plots.length + legacyLeads.length > 0;
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
      <Navigation overlay />
      <HomeHero locale={locale} stats={snapshot.stats} />
      {hasCards && (
        <section className="holding-section" aria-labelledby="home-areas">
          <div className="brand-container">
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 lg:gap-16 items-end mb-10 lg:mb-14">
              <div>
                <span className="holding-eyebrow">
                  {t('homeV2.showcaseEyebrow')}
                </span>
                <h2 id="home-areas" className="holding-title mt-4">
                  {keepWords(t('homeV2.showcaseTitle'), locale)}
                </h2>
              </div>
              <p className="holding-lead">
                {t(plots.length ? 'catalog.lede' : 'catalog.ledeNoPlots')}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {offers.map((offer) => (
                <OfferGridCard
                  key={offer.code}
                  offer={offer}
                  locale={locale}
                  headingLevel="h3"
                />
              ))}
              {featured.map((lead) => (
                <ShowcaseGridCard
                  key={lead.code}
                  card={parseShowcase(lead.showcase)!}
                  locale={locale}
                  headingLevel="h3"
                  photo
                />
              ))}
              {plots.map((plot) => (
                <ProspectingGridCard
                  key={plot.code}
                  plot={plot}
                  locale={locale}
                  headingLevel="h3"
                />
              ))}
              {legacyLeads.map((lead) => (
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
              ))}
              {coalCount > 0 && (
                <Link
                  href={`/${locale}/leads?commodity=coal`}
                  className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden bg-brand-deep p-6 text-brand-chalk"
                >
                  <Image
                    src={SPECIMENS.coal}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/60 to-transparent"
                  />
                  <span className="relative text-xs text-brand-chalk/70">
                    {t('catalog.kinds.find')}
                  </span>
                  <span className="relative mt-3 font-serif text-[30px] leading-tight">
                    {t('catalog.groups.coal')}
                  </span>
                  <span className="relative mt-2 text-brand-chalk/80">
                    {t('homeV2.coalTile').replace('{count}', String(coalCount))}
                  </span>
                  <span className="relative mt-6 inline-flex items-center gap-2 font-medium">
                    {t('portal.ctaLeads')}
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="absolute right-3 top-3 text-[11px] text-brand-chalk/55">
                    {t('homeV2.illustration')}
                  </span>
                </Link>
              )}
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
      <HomeMinerals locale={locale} />
      <HomeServices locale={locale} />
      <section className="holding-section bg-brand-surface">
        <div className="brand-container">
          <h2 className="holding-title">
            {keepWords(t('dealSteps.title'), locale)}
          </h2>
          <ol className="mt-10 lg:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="border-t border-brand-line pt-5">
                <span
                  aria-hidden
                  className="font-serif font-light text-5xl text-brand-accent"
                >
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
      <PhotoBand
        src={SCENES.geologists}
        label={t('homeV2.illustration')}
        labelledBy="home-team"
      >
        <span className="holding-eyebrow">{t('navigation.about')}</span>
        <h2
          id="home-team"
          className="font-serif font-light mt-5 max-w-[22ch] text-[30px] md:text-[42px] lg:text-[52px] leading-[1.12] tracking-[-0.02em]"
        >
          {keepWords(t('holdingCompany.team'), locale)}
        </h2>
        <Link
          href={`/${locale}/about`}
          className="brand-button-secondary home-hero-ghost mt-9"
        >
          {t('navigation.about')}
          <ArrowUpRight aria-hidden className="w-5 h-5" />
        </Link>
      </PhotoBand>
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
                href={`/${locale}/insights/${slug}`}
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
      <PhotoBand
        src={SCENES.foothills}
        label={t('homeV2.illustration')}
        labelledBy="home-cta"
      >
        <h2
          id="home-cta"
          className="font-serif font-light max-w-[16ch] text-[36px] md:text-[54px] lg:text-[68px] leading-[1.03] tracking-[-0.025em]"
        >
          {keepWords(t('insights.ctaTitle'), locale)}
        </h2>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-brand-chalk/85">
          {t('contact.subtitle')}
        </p>
        <Link href={`/${locale}/contact`} className="brand-button mt-9">
          {t('navigation.contact')}
          <ArrowUpRight aria-hidden className="w-5 h-5" />
        </Link>
      </PhotoBand>
      <Footer />
    </div>
  );
}
