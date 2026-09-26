import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Badge } from '@/components/ui/badge';
import LeadLockedSection from '@/components/features/LeadLockedSection';
import ContactChannels from '@/components/features/ContactChannels';
import InquiryForm from '@/components/features/InquiryForm';
import { getContactConfig, hasAnyChannel } from '@/lib/config/contacts';
import { formatCheckDate } from '@/lib/leads/check-date';
import { toLocale } from '@/lib/seo/site';
import { leadJsonLd } from '@/lib/seo/lead-jsonld';
import {
  MapPin,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Lock,
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Scale,
  Archive,
  Compass,
  FileSignature,
  FolderCheck,
  ArrowRight,
} from 'lucide-react';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import { TYPE_LABELS, isFreeStatus } from '@/lib/leads/types';
import { getServerTranslation } from '@/lib/i18n/translations';
import { GUIDE } from '@/lib/insights/registry';

export const dynamic = 'force-dynamic';

export default async function LeadTeaserPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const { t } = getServerTranslation(locale);
  const lead = await getPublishedLeadByCode(code);
  if (!lead) notFound();

  const free = isFreeStatus(lead.license_status);
  const checkedOn = formatCheckDate(lead.last_verified, toLocale(locale));
  const contacts = getContactConfig();
  const coordVerified =
    free &&
    (lead.license_status || '').toUpperCase().includes('COORD_VERIFIED');
  const isSold = lead.status === 'SOLD';
  const fairValue =
    lead.fair_value_min_usd_m || lead.fair_value_max_usd_m
      ? `$${lead.fair_value_min_usd_m ?? '?'}–${lead.fair_value_max_usd_m ?? '?'} млн`
      : null;

  const teaserTitle =
    lead.teaser_title || `Золото · ${lead.region || 'Казахстан'}`;

  const { place: jsonLd, breadcrumb: breadcrumbJsonLd } = leadJsonLd(
    lead,
    toLocale(locale)
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-gray-400 mb-6 flex items-center gap-1.5"
          >
            <Link href={`/${locale}/leads`} className="hover:text-gray-600">
              {t('leadDetail.breadcrumbLeads')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 dark:text-gray-300">
              {lead.code}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {isSold ? (
                    <Badge variant="default">{t('leadDetail.badgeSold')}</Badge>
                  ) : free ? (
                    <Badge variant="gold">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {t('leadDetail.badgeFree')}
                    </Badge>
                  ) : null}
                  <Badge variant="blue">{lead.mineral}</Badge>
                  <Badge variant="default">
                    {TYPE_LABELS[lead.type] ?? t('leadDetail.typeFallback')}
                  </Badge>
                </div>
                <h1 className="font-serif font-light text-3xl lg:text-4xl tracking-tight text-gray-900 dark:text-gray-50">
                  {teaserTitle}
                </h1>
                {lead.region && (
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" /> {lead.region}
                    {lead.distance_band ? ` · ${lead.distance_band}` : ''}
                  </p>
                )}
              </div>

              {/* Value evidence */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BarChart3
                    className="w-4 h-4 text-gold-dark dark:text-gold-light"
                    aria-hidden="true"
                  />
                  {t('leadDetail.valueEvidenceHeading')}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lead.grade_display && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        {t('leadDetail.gradeAu')}
                      </dt>
                      <dd className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {lead.grade_display}
                      </dd>
                      {lead.grade_label && (
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {lead.grade_label}
                        </p>
                      )}
                    </div>
                  )}
                  {lead.reserve_categories &&
                    lead.reserve_categories.length > 0 && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-gray-400">
                          {t('leadDetail.reserveCategories')}
                        </dt>
                        <dd className="text-sm font-medium">
                          {lead.reserve_categories.join(', ')}
                        </dd>
                      </div>
                    )}
                  {lead.byproducts_display && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        {t('leadDetail.byproducts')}
                      </dt>
                      <dd className="text-sm font-medium">
                        {lead.byproducts_display}
                      </dd>
                    </div>
                  )}
                  {fairValue && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        {t('leadDetail.fairValue')}
                      </dt>
                      <dd className="text-sm font-medium inline-flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gold-dark" />{' '}
                        {fairValue}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="text-[12px] text-gray-400 mt-4 flex items-start gap-1.5">
                  <Scale
                    className="w-4 h-4 shrink-0 text-gold-dark dark:text-gold-light"
                    aria-hidden="true"
                  />
                  <span>{t('leadDetail.valueNote')}</span>
                </p>
              </section>

              {/* Legal status */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Scale
                    className="w-4 h-4 text-gold-dark dark:text-gold-light"
                    aria-hidden="true"
                  />
                  {t('leadDetail.legalStatusHeading')}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {free ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {free
                        ? coordVerified
                          ? t('leadDetail.freeVerified')
                          : t('leadDetail.freeRegistry')
                        : t('leadDetail.statusPending')}
                    </span>
                  </div>
                  {free && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />{' '}
                      {t('leadDetail.verifyDate')} {checkedOn}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  {t('leadDetail.transferNote')}
                </p>
                <Link
                  href={`/${locale}/insights/${GUIDE.rightsTransfer}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-dark dark:text-gold-light hover:underline underline-offset-4"
                >
                  {t('insights.links.rightsTransfer')}
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </section>

              {/* How it works legally */}
              <section className="rounded-xl border border-gold/40 bg-[rgba(200,162,75,0.05)] p-5">
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ShieldCheck
                    className="w-4 h-4 text-gold-dark dark:text-gold-light"
                    aria-hidden="true"
                  />
                  {t('leadDetail.howItWorksHeading')}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                  <li className="flex items-start gap-2.5">
                    <Archive className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('leadDetail.howItWorksPoint1')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Compass className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('leadDetail.howItWorksPoint2')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FolderCheck className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('leadDetail.howItWorksPoint3')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FileSignature className="w-4 h-4 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('leadDetail.howItWorksPoint4')}
                    </span>
                  </li>
                </ul>
              </section>

              {/* Locked */}
              <LeadLockedSection locale={locale} />

              {/* Contact — messengers first, form as fallback; no login */}
              <section
                id="inquiry"
                className="scroll-mt-24 rounded-xl border border-gold/40 p-5"
              >
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-1">
                  {t('contact.discussHeading')}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {t('contact.discussNote')}
                </p>
                <ContactChannels
                  config={contacts}
                  locale={locale}
                  leadCode={lead.code}
                />
                <h3 className="mt-6 mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {hasAnyChannel(contacts)
                    ? t('contact.orForm')
                    : t('contact.formTitle')}
                </h3>
                <InquiryForm locale={locale} leadCode={lead.code} />
              </section>

              {/* Region indicator (exact GPS hidden) */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-2">
                  {t('leadDetail.locationHeading')}
                </h2>
                <div className="h-40 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-center">
                  <MapPin className="w-7 h-7 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {lead.region || t('leadDetail.locationFallback')}
                  </p>
                  <p className="text-[12px] text-gray-400">
                    {t('leadDetail.locationHidden')}
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="rounded-xl border border-gold/40 bg-[rgba(200,162,75,0.06)] p-5">
                  <div className="text-xs text-gray-500 mb-1">
                    {t('leadDetail.priceCardLabel')}
                  </div>
                  <div className="font-serif text-xl text-gold-dark dark:text-gold-light">
                    {t('leadDetail.priceFallback')}
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    {t('leadDetail.includedHeading')}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                      {t('leadDetail.includedCoords')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                      {t('leadDetail.includedAssay')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                      {t('leadDetail.includedLegal')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gold-dark dark:text-gold-light" />
                      {t('leadDetail.includedContacts')}
                    </li>
                  </ul>

                  {isSold ? (
                    <div className="mt-5 w-full text-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm font-medium">
                      {t('leadDetail.sold')}
                    </div>
                  ) : (
                    <a
                      href="#inquiry"
                      className="mt-5 block w-full text-center px-4 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      {t('contact.discussHeading')}
                    </a>
                  )}
                  <p className="text-[12px] text-gray-400 mt-3 text-center">
                    {t('contact.discussNote')}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
