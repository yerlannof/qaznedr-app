import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadCard from '@/components/cards/LeadCard';
import ShowcaseList, { legacyLeads } from '@/components/showcase/ShowcaseList';
import { getContactConfig } from '@/lib/config/contacts';
import ClosingCta from '@/components/features/ClosingCta';
import { mineralHub, hubMineralName, MINERAL_HUBS } from '@/lib/leads/minerals';
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { getServerTranslation } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd } from '@/lib/seo/article-jsonld';
import { toLocale, localeUrl, HREFLANG } from '@/lib/seo/site';
import { GUIDE, insightHref } from '@/lib/insights/registry';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string; mineral: string }> };
const GOLD_GUIDE_KEYS = [
  'geologicalMap',
  'eastKazakhstanGoldMap',
  'satelliteGoldMap',
] as const;

export async function generateMetadata({ params }: Props) {
  const { locale: raw, mineral } = await params;
  if (!mineralHub(mineral)) notFound();
  const locale = toLocale(raw);
  const { t } = getServerTranslation(locale);
  const name = hubMineralName(mineral, locale);
  return buildPageMetadata({
    locale,
    path: `/minerals/${mineral}`,
    title: `${name} · ${t('leadDetail.breadcrumbLeads')}`,
    description: `${name}: ${t('leadsCatalog.valueProp2')}`,
  });
}

export default async function MineralPage({ params }: Props) {
  const { locale: raw, mineral } = await params;
  if (!mineralHub(mineral)) notFound();
  const locale = toLocale(raw);
  const { t } = getServerTranslation(locale);
  const { leads, total } = await listPublishedLeads({ mineral, limit: 24 });
  const name = hubMineralName(mineral, locale);
  const title = `${name} · ${t('leadDetail.breadcrumbLeads')}`;
  const description = `${name}: ${t('leadsCatalog.valueProp2')}`;
  const path = `/minerals/${mineral}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: localeUrl(locale, path),
      inLanguage: HREFLANG[locale],
      description,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: leads.map((lead, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: localeUrl(locale, `/leads/${lead.code}`),
        })),
      },
    },
    breadcrumbJsonLd([
      { name: t('navigation.home'), url: localeUrl(locale) },
      {
        name: t('leadDetail.breadcrumbLeads'),
        url: localeUrl(locale, '/leads'),
      },
      { name, url: localeUrl(locale, path) },
    ]),
  ];
  return (
    <>
      <Navigation />
      <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <header className="brand-container py-12 lg:py-20 border-b border-brand-line">
          <Link
            href={`/${locale}/leads`}
            className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4 text-sm"
          >
            {t('leadDetail.breadcrumbLeads')}
          </Link>
          <h1 className="holding-title mt-5">{title}</h1>
          <p className="holding-lead mt-6 max-w-2xl">
            {t('leadsCatalog.valueProp2')}
          </p>
          <nav
            aria-label={t('listingsFilters.mineral')}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          >
            {MINERAL_HUBS.map((hub) => (
              <Link
                key={hub.slug}
                href={`/${locale}/minerals/${hub.slug}`}
                aria-current={hub.slug === mineral ? 'page' : undefined}
                className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {hubMineralName(hub.slug, locale)}
              </Link>
            ))}
          </nav>
        </header>
        <section className="brand-container py-12 lg:py-16">
          <p className="mb-6 text-brand-muted">
            {t('leadsCatalog.foundCount', { count: total })}
          </p>
          {leads.length ? (
            <>
              <ShowcaseList
                leads={leads}
                locale={locale}
                contacts={getContactConfig()}
                overview={false}
              />
              {legacyLeads(leads).length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {legacyLeads(leads).map((lead) => (
                    <LeadCard key={lead.code} lead={lead} locale={locale} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="py-10 border-y border-brand-line">
              {t('leadsCatalog.emptyTitle')}
            </p>
          )}
          <Link
            className="brand-button-secondary mt-8"
            href={`/${locale}/leads?mineral=${mineral}`}
          >
            {t('leadDetail.breadcrumbLeads')} · {name}
          </Link>
        </section>
        <section className="brand-container py-12 border-t border-brand-line">
          <h2 className="font-serif text-3xl">
            {t('leadDetail.howItWorksHeading')}
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <li
                key={n}
                className="border-t border-brand-line pt-4 leading-relaxed"
              >
                <span className="block mb-3 text-brand-muted">0{n}</span>
                {t(`leadDetail.howItWorksPoint${n}`)}
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {mineral === 'gold' &&
              GOLD_GUIDE_KEYS.map((key) => (
                <Link
                  key={key}
                  className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
                  href={insightHref(locale, GUIDE[key])}
                >
                  {t(`insights.links.${key}`)}
                </Link>
              ))}
            <Link
              className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
              href={insightHref(locale, GUIDE.reserveClassification)}
            >
              {t('insights.links.reserveClassification')}
            </Link>
            <Link
              className="brand-focus inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${locale}/faq`}
            >
              {t('footerNav.info.faq')}
            </Link>
          </div>
        </section>
        <ClosingCta locale={locale} variant="brand" />
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
