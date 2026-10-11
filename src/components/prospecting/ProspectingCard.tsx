import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import ShowcaseWhatsAppLink from '@/components/showcase/ShowcaseWhatsAppLink';
import PlotOutline from './PlotOutline';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';
import type { Plot } from '@/lib/prospecting/plots';
import {
  formatArea,
  formatDate,
  placeLine,
  plotPath,
  whatsappText,
} from '@/lib/prospecting/present';
import type { Locale } from '@/lib/seo/site';

/** A prospecting plot in a list (approved review 18 card). */
export default function ProspectingCard({
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
  const href = `/${locale}${plotPath(code)}`;
  const open = plot.status === 'open';
  const useWhatsApp = locale !== 'zh' && contacts.whatsappNumber;
  const figures = [
    [
      `${formatArea(plot.area_ha, locale)} ${t('prospecting.ha')}`,
      t('prospecting.cardArea'),
    ],
    [formatDate(plot.valid_until), t('prospecting.cardValidUntil')],
    [t('prospecting.cardShareValue'), t('prospecting.cardShare')],
  ];
  return (
    <article
      id={code}
      className="grid gap-x-10 gap-y-4 border-b border-brand-line py-8 md:grid-cols-[300px_minmax(0,1fr)] lg:py-10"
    >
      <Link href={href} className="brand-focus block" tabIndex={-1} aria-hidden>
        <PlotOutline plot={plot} locale={locale} compact />
      </Link>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="bg-brand-accent px-2 py-0.5 font-semibold tracking-wide text-brand-slate">
            {code}
          </span>
          <span className="border border-brand-line px-2 py-0.5">
            {t('prospecting.kind')} ·{' '}
            {t(open ? 'prospecting.statusOpen' : 'prospecting.statusMatched')}
          </span>
        </p>
        <h2 className="mt-3 text-xl font-semibold">
          <Link href={href} className="brand-focus hover:underline">
            {t('prospecting.cardTitle', {
              area: formatArea(plot.area_ha, locale),
            })}
          </Link>
        </h2>
        <p className="mt-1 text-brand-muted">{placeLine(plot, locale)}</p>
        <dl className="mt-4 grid grid-cols-3 border-t border-brand-line">
          {figures.map(([value, label], i) => (
            <div
              key={label}
              className={`py-3 pr-3 ${i ? 'border-l border-brand-line pl-3' : ''}`}
            >
              <dd className="font-serif text-lg leading-tight lg:text-2xl">
                {value}
              </dd>
              <dt className="mt-1 text-xs text-brand-muted">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex gap-2 text-sm text-brand-muted">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t('prospecting.note')}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {open &&
            (useWhatsApp ? (
              <ShowcaseWhatsAppLink
                href={whatsappLink(
                  contacts.whatsappNumber!,
                  whatsappText(plot, locale)
                )}
                label={t('prospecting.discuss', { code })}
                locale={locale}
                code={code}
              />
            ) : (
              <Link
                href={`${href}#contact`}
                className="brand-button brand-focus w-full sm:w-auto"
              >
                <MessageCircle aria-hidden className="size-4" />
                {t('prospecting.discuss', { code })}
              </Link>
            ))}
          <Link
            href={href}
            className="brand-focus inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
          >
            {t('prospecting.more')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
