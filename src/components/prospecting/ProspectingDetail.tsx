import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import ContactChannels from '@/components/features/ContactChannels';
import CoordinatesTable from './CoordinatesTable';
import PlotOutline from './PlotOutline';
import { translate } from '@/lib/i18n/translations';
import { hasAnyChannel, type ContactConfig } from '@/lib/config/contacts';
import { GUIDE, insightHref } from '@/lib/insights/registry';
import { plotGeometry, type Plot } from '@/lib/prospecting/plots';
import {
  PROSPECTING_PATH,
  formatArea,
  formatDate,
  mapLinks,
  placeLine,
  plotTitle,
  whatsappText,
} from '@/lib/prospecting/present';
import type { Locale } from '@/lib/seo/site';

const h2 = 'font-serif text-2xl lg:text-3xl leading-tight';
const h3 = 'font-semibold';
const li = 'border-t border-brand-line py-2.5 leading-relaxed';

/** Prospecting plot page body (approved review 18-prospecting). */
export default function ProspectingDetail({
  plot,
  locale,
  contacts,
}: {
  plot: Plot;
  locale: Locale;
  contacts: ContactConfig;
}) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const { code } = plot;
  const open = plot.status === 'open';
  const links = mapLinks(plotGeometry(plot).center);
  const facts: [string, string][] = [
    [t('prospecting.factMineral'), t('prospecting.mineral')],
    [
      t('prospecting.factArea'),
      `${formatArea(plot.area_ha, locale)} ${t('prospecting.ha')}`,
    ],
    [
      t('prospecting.factLicense'),
      t('prospecting.factLicenseValue', {
        number: plot.license_number,
        date: formatDate(plot.issued_at),
      }),
    ],
    [
      t('prospecting.factValidUntil'),
      t('prospecting.factValidUntilValue', {
        date: formatDate(plot.valid_until),
      }),
    ],
    [t('prospecting.factShare'), t('prospecting.factShareValue')],
    [
      t('prospecting.factStatus'),
      t(open ? 'prospecting.statusOpen' : 'prospecting.statusMatched'),
    ],
  ];
  if (plot.holder_confirmed_at) {
    facts.push([
      t('prospecting.factConfirmed'),
      t('prospecting.factConfirmedValue', {
        date: formatDate(plot.holder_confirmed_at),
      }),
    ]);
  }
  const mapButton =
    'brand-button-secondary brand-focus w-full sm:w-auto inline-flex items-center gap-2';

  return (
    <div className="brand-container pb-12 lg:pb-20">
      <nav
        aria-label={t('navigation.home')}
        className="flex flex-wrap items-center gap-3 py-6 text-sm text-brand-muted"
      >
        <Link
          className="brand-focus min-h-11 inline-flex items-center underline underline-offset-4"
          href={`/${locale}${PROSPECTING_PATH}`}
        >
          {t('prospecting.breadcrumb')}
        </Link>
        <span aria-hidden>/</span>
        <span>{code}</span>
      </nav>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          <PlotOutline plot={plot} locale={locale} />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-brand-accent px-2 py-0.5 font-semibold tracking-wide text-brand-slate">
              {code}
            </span>
            <span className="border border-brand-line px-2 py-0.5">
              {t('prospecting.kind')} ·{' '}
              {t(open ? 'prospecting.statusOpen' : 'prospecting.statusMatched')}
            </span>
          </p>
          <h1 className="holding-title mt-4">{plotTitle(plot, locale)}</h1>
          <p className="mt-4 flex gap-2 text-brand-muted">
            <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
            <span>
              {placeLine(plot, locale)}. {t('prospecting.lead')}
            </span>
          </p>
          <table className="mt-6 w-full border-collapse text-[15px]">
            <tbody>
              {facts.map(([label, value]) => (
                <tr key={label}>
                  <th
                    scope="row"
                    className="w-[45%] border-t border-brand-line py-2.5 pr-4 text-left align-top font-normal text-brand-muted"
                  >
                    {label}
                  </th>
                  <td className="border-t border-brand-line py-2.5 align-top font-semibold">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!open && (
            <p className="mt-4 border border-brand-line bg-brand-surface p-4 text-sm">
              {t('prospecting.matchedNote')}{' '}
              <Link
                href={`/${locale}${PROSPECTING_PATH}`}
                className="brand-focus underline underline-offset-4"
              >
                {t('prospecting.allPlots')}
              </Link>
            </p>
          )}
        </div>
      </div>

      <section className="mt-12 grid gap-8 border-t border-brand-line pt-8 lg:grid-cols-2">
        <div>
          <h2 className={h2}>{t('prospecting.boundsHeading')}</h2>
          <p className="mt-3 text-brand-muted">{t('prospecting.boundsNote')}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
              className={mapButton}
            >
              <MapPin aria-hidden className="size-4" />
              {t('prospecting.openGoogle')}
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
            <a
              href={links.twoGis}
              target="_blank"
              rel="noopener noreferrer"
              className={mapButton}
            >
              <MapPin aria-hidden className="size-4" />
              {t('prospecting.open2gis')}
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <CoordinatesTable plot={plot} locale={locale} />
          {plot.corrected_corners.length > 0 && (
            <p className="mt-3 text-sm text-brand-muted">
              *{' '}
              {t('prospecting.correctedNote', {
                points: plot.corrected_corners.join(', '),
              })}
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-8 border-t border-brand-line pt-8 lg:grid-cols-3">
        <div>
          <h2 className={h3}>{t('prospecting.howHeading')}</h2>
          <ol className="mt-3">
            {['how1', 'how2', 'how3'].map((key, i) => (
              <li key={key} className={`${li} flex gap-3`}>
                <span className="grid size-7 shrink-0 place-items-center bg-brand-ink text-sm font-semibold text-brand-bg">
                  {i + 1}
                </span>
                <span>{t(`prospecting.${key}`)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className={h3}>{t('prospecting.limitsHeading')}</h2>
          <ul className="mt-3">
            {['limit1', 'limit2', 'limit3', 'limit4', 'limit5'].map((key) => (
              <li key={key} className={li}>
                {t(`prospecting.${key}`)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-brand-muted">
            {t('prospecting.limitsSource')}
          </p>
        </div>
        <div>
          <h2 className={h3}>{t('prospecting.whoHeading')}</h2>
          <ul className="mt-3">
            {['who1', 'who2', 'who3'].map((key) => (
              <li key={key} className={li}>
                {t(`prospecting.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-8 border-t border-brand-line pt-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <p className="border border-brand-line bg-brand-surface p-5 text-sm text-brand-muted">
            <strong className="text-brand-ink">
              {t('prospecting.disclaimerLabel')}
            </strong>{' '}
            {t('prospecting.disclaimer')}
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href={insightHref(locale, GUIDE.artisanalMining)}
                className="brand-focus inline-flex min-h-11 items-center gap-3 underline underline-offset-4"
              >
                <BookOpen aria-hidden className="size-4 shrink-0" />
                {t('prospecting.guideLink')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}${PROSPECTING_PATH}`}
                className="brand-focus inline-flex min-h-11 items-center gap-3 underline underline-offset-4"
              >
                <ArrowRight aria-hidden className="size-4 shrink-0" />
                {t('prospecting.allPlots')}
              </Link>
            </li>
          </ul>
        </div>
        {open && (
          <section
            id="contact"
            className="scroll-mt-24 border border-brand-line bg-brand-surface p-5"
          >
            <h2 className={h3}>{t('prospecting.contactHeading')}</h2>
            <p className="mt-2 mb-4 text-sm text-brand-muted">
              {t('prospecting.contactNote', { code })}
            </p>
            {hasAnyChannel(contacts) ? (
              <ContactChannels
                config={contacts}
                locale={locale}
                leadCode={code}
                message={whatsappText(plot, locale)}
              />
            ) : (
              <Link
                href={`/${locale}/contact`}
                className="brand-button brand-focus w-full"
              >
                <MessageCircle aria-hidden className="size-4" />
                {t('prospecting.discuss', { code })}
              </Link>
            )}
          </section>
        )}
      </section>
    </div>
  );
}
