import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, LockKeyhole, MapPin } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadLockedSection from '@/components/features/LeadLockedSection';
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig, hasAnyChannel } from '@/lib/config/contacts';
import { formatCheckDate } from '@/lib/leads/check-date';
import { toLocale } from '@/lib/seo/site';
import { leadJsonLd } from '@/lib/seo/lead-jsonld';
import {
  leadSeoText,
  leadMineralName,
  leadRegionName,
} from '@/lib/seo/lead-metadata';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import { parseShowcase } from '@/lib/leads/showcase';
import { showcaseSeoText } from '@/lib/seo/showcase-seo';
import ShowcaseDetail from '@/components/showcase/ShowcaseDetail';
import { isFreeStatus } from '@/lib/leads/types';
import { getServerTranslation } from '@/lib/i18n/translations';
import { GUIDE, insightHref } from '@/lib/insights/registry';

export const dynamic = 'force-dynamic';
const section = 'border-t border-brand-line py-8 lg:py-10';
const heading = 'font-serif text-2xl lg:text-3xl leading-tight';
const sourceLanguage = (s: string) => (/[А-Яа-яЁё]/.test(s) ? 'ru' : undefined);

export default async function LeadTeaserPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: raw, code } = await params;
  const locale = toLocale(raw);
  const { t } = getServerTranslation(locale);
  const lead = await getPublishedLeadByCode(code);
  if (!lead) notFound();
  const showcase = parseShowcase(lead.showcase);
  if (showcase) {
    const text = showcaseSeoText(showcase, locale);
    const jsonLd = leadJsonLd(lead, locale, text);
    return (
      <>
        <Navigation />
        <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
          <ShowcaseDetail
            showcase={showcase}
            locale={locale}
            contacts={getContactConfig()}
          />
        </div>
        <Footer />
        {[jsonLd.place, jsonLd.breadcrumb].map((data, i) => (
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
  const free = isFreeStatus(lead.license_status);
  const coordVerified =
    free &&
    (lead.license_status ?? '').toUpperCase().includes('COORD_VERIFIED');
  const checkedOn = formatCheckDate(lead.last_verified, locale);
  const region =
    leadRegionName(lead.region, locale) ||
    lead.region ||
    t('leadDetail.locationFallback');
  const contacts = getContactConfig();
  const { place, breadcrumb } = leadJsonLd(lead, locale);
  const type = ['placer', 'bedrock', 'other'].includes(lead.type)
    ? lead.type
    : 'other';
  const number = (n: number | null) =>
    n === null
      ? '?'
      : new Intl.NumberFormat(locale === 'kz' ? 'kk' : locale, {
          maximumFractionDigits: 2,
        }).format(n * 1000000);
  const fairValue =
    lead.fair_value_min_usd_m != null || lead.fair_value_max_usd_m != null
      ? `${number(lead.fair_value_min_usd_m)}–${number(lead.fair_value_max_usd_m)} USD`
      : null;
  return (
    <>
      <Navigation />
      <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <div className="brand-container pb-12 lg:pb-20">
          <nav
            aria-label={t('navigation.home')}
            className="flex flex-wrap items-center gap-3 py-6 text-sm text-brand-muted"
          >
            <Link
              className="brand-focus min-h-11 inline-flex items-center underline underline-offset-4"
              href={`/${locale}/leads`}
            >
              {t('leadDetail.breadcrumbLeads')}
            </Link>
            <span aria-hidden>/</span>
            <span>{lead.code}</span>
          </nav>
          <header className="border-b border-brand-line pb-10">
            <p className="text-sm text-brand-muted">
              {lead.code} · {leadMineralName(lead.mineral, locale)} ·{' '}
              {t(`leadCard.types.${type}`)}
            </p>
            <h1 className="holding-title mt-5 max-w-4xl">
              {leadSeoText(lead, locale).title}
            </h1>
            <p className="mt-5 flex items-center gap-2 text-brand-muted">
              <MapPin aria-hidden className="size-4" />
              {region}
            </p>
            <p className="mt-4 text-sm">
              {free
                ? coordVerified
                  ? t('leadDetail.freeVerified')
                  : t('leadDetail.freeRegistry')
                : t('leadDetail.statusPending')}
              <span className="block mt-1 text-brand-muted">
                {t('leadDetail.verifyDate')} {checkedOn}
              </span>
            </p>
          </header>
          <div className="grid gap-x-12 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <section className={section}>
                <h2 className={heading}>
                  {t('leadDetail.valueEvidenceHeading')}
                </h2>
                <dl className="mt-7 grid gap-6 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-brand-muted">
                      {t('listingsFilters.mineral')}
                    </dt>
                    <dd className="mt-1">
                      {leadMineralName(lead.mineral, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-brand-muted">
                      {t('leadsCatalog.type')}
                    </dt>
                    <dd className="mt-1">{t(`leadCard.types.${type}`)}</dd>
                  </div>
                  {lead.grade_display && (
                    <div className="sm:col-span-2">
                      <dt className="text-brand-muted">
                        {t('leadDetail.gradeAu')}
                      </dt>
                      <dd
                        className="mt-2 text-xl"
                        lang={sourceLanguage(lead.grade_display)}
                      >
                        {lead.grade_display}
                      </dd>
                      {lead.grade_label && (
                        <dd
                          className="mt-2 text-brand-muted"
                          lang={sourceLanguage(lead.grade_label)}
                        >
                          {lead.grade_label}
                        </dd>
                      )}
                    </div>
                  )}
                  {!!lead.reserve_categories?.length && (
                    <div className="sm:col-span-2">
                      <dt className="text-brand-muted">
                        {t('leadDetail.reserveCategories')}
                      </dt>
                      <dd className="mt-1">
                        {lead.reserve_categories.join(', ')}
                      </dd>
                      <dd className="mt-2 text-brand-muted leading-relaxed">
                        {t('leadDetail.assessmentNote')}
                      </dd>
                    </div>
                  )}
                  {lead.byproducts_display && (
                    <div>
                      <dt className="text-brand-muted">
                        {t('leadDetail.byproducts')}
                      </dt>
                      <dd
                        className="mt-1"
                        lang={sourceLanguage(lead.byproducts_display)}
                      >
                        {lead.byproducts_display}
                      </dd>
                    </div>
                  )}
                  {fairValue && (
                    <div>
                      <dt className="text-brand-muted">
                        {t('leadDetail.fairValue')}
                      </dt>
                      <dd className="mt-1">{fairValue}</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-6 text-sm leading-relaxed text-brand-muted">
                  {t('leadDetail.valueNote')}
                </p>
              </section>
              <LeadLockedSection locale={locale} />
              <section id="inquiry" className={`${section} scroll-mt-24`}>
                <h2 className={heading}>{t('contact.discussHeading')}</h2>
                <p className="mt-4 mb-6 text-brand-muted leading-relaxed">
                  {t('contact.discussNote')}
                </p>
                <div id="contact-channels" className="scroll-mt-24">
                  <ContactChannels
                    config={contacts}
                    locale={locale}
                    leadCode={lead.code}
                  />
                </div>
                <h3 className="mt-8 mb-5 font-semibold">
                  {hasAnyChannel(contacts)
                    ? t('contact.orForm')
                    : t('contact.formTitle')}
                </h3>
                <InquiryForm locale={locale} leadCode={lead.code} />
              </section>
              <section className={section}>
                <h2 className={heading}>{t('dealSteps.step3Title')}</h2>
                <p className="mt-5 leading-relaxed text-brand-muted">
                  {t('dealSteps.step3Desc')}
                </p>
                <h3 className="mt-8 font-serif text-2xl">
                  {t('leadDetail.howItWorksHeading')}
                </h3>
                <ol className="mt-6 grid gap-6 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((n) => (
                    <li
                      key={n}
                      className="border-t border-brand-line pt-4 text-sm leading-relaxed"
                    >
                      <span className="mb-2 block text-brand-muted">0{n}</span>
                      {t(`leadDetail.howItWorksPoint${n}`)}
                    </li>
                  ))}
                </ol>
              </section>
              <section className={section}>
                <h2 className={heading}>
                  {t('leadDetail.legalStatusHeading')}
                </h2>
                <p className="mt-5 text-sm leading-relaxed">
                  {free
                    ? coordVerified
                      ? t('leadDetail.freeVerified')
                      : t('leadDetail.freeRegistry')
                    : t('leadDetail.statusPending')}
                </p>
                <p className="mt-2 text-sm text-brand-muted">
                  {t('leadDetail.verifyDate')} {checkedOn}
                </p>
                <p className="mt-6 leading-relaxed text-brand-muted">
                  {t('leadDetail.transferNote')}
                </p>
                <Link
                  className="brand-focus mt-5 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
                  href={insightHref(locale, GUIDE.rightsTransfer)}
                >
                  {t('insights.links.rightsTransfer')}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                </Link>
              </section>
              <section className={section}>
                <h2 className={heading}>{t('leadDetail.locationHeading')}</h2>
                <p className="mt-5">{region}</p>
                <p className="mt-2 text-sm text-brand-muted">
                  {t('leadDetail.locationHidden')}
                </p>
              </section>
            </div>
            <aside className="py-8 lg:py-10">
              <div className="lg:sticky lg:top-24 border border-brand-line bg-brand-surface p-6">
                <LockKeyhole aria-hidden className="size-6" />
                <p className="mt-6 text-sm text-brand-muted">
                  {t('leadDetail.priceCardLabel')}
                </p>
                <p className="mt-2 font-serif text-3xl">
                  {t('leadDetail.priceFallback')}
                </p>
                <p className="mt-6 text-sm">
                  {t('leadDetail.includedHeading')}
                </p>
                <ul className="mt-4 space-y-3 text-sm text-brand-muted">
                  {[
                    'includedCoords',
                    'includedAssay',
                    'includedLegal',
                    'includedContacts',
                  ].map((key) => (
                    <li key={key}>{t(`leadDetail.${key}`)}</li>
                  ))}
                </ul>
                <a className="brand-button mt-7 w-full" href="#inquiry">
                  {t('contact.discussHeading')}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
      {[place, breadcrumb].map((data, i) => (
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
