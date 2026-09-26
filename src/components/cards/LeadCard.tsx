'use client';

import Link from 'next/link';
import { ArrowUpRight, Gem } from 'lucide-react';
import { type LeadTeaser, isFreeStatus } from '@/lib/leads/types';
import {
  leadMineralName,
  leadRegionName,
  leadSeoText,
} from '@/lib/seo/lead-metadata';
import { formatCheckDate } from '@/lib/leads/check-date';
import { toLocale } from '@/lib/seo/site';
import { translate } from '@/lib/i18n/translations';

/** Public teaser fields only; no private lead data reaches the browser. */
export default function LeadCard({
  lead,
  locale,
}: {
  lead: LeadTeaser;
  locale: string;
}) {
  const loc = toLocale(locale);
  const t = (key: string) => translate(loc, key);
  const free = isFreeStatus(lead.license_status);
  const region = leadRegionName(lead.region, loc) || lead.region;
  const mineral = leadMineralName(lead.mineral, loc);
  const typeKey = ['placer', 'bedrock', 'other'].includes(lead.type)
    ? lead.type
    : 'other';

  return (
    <article className="flex h-full flex-col border-t border-brand-line bg-brand-surface p-5 text-brand-ink">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          {lead.code}
        </p>
        <Gem aria-hidden="true" className="size-6 shrink-0 text-brand-ink" />
      </div>
      <h2 className="mt-5 font-serif text-2xl leading-snug">
        <Link
          href={`/${locale}/leads/${lead.code}`}
          className="brand-focus hover:underline"
        >
          {leadSeoText(lead, loc).title}
        </Link>
      </h2>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-brand-muted">{t('listingsFilters.mineral')}</dt>
          <dd>{mineral}</dd>
        </div>
        <div>
          <dt className="text-brand-muted">{t('leadsCatalog.region')}</dt>
          <dd>{region || t('leadCard.regionFallback')}</dd>
        </div>
        <div>
          <dt className="text-brand-muted">{t('leadsCatalog.type')}</dt>
          <dd>{t(`leadCard.types.${typeKey}`)}</dd>
        </div>
      </dl>
      {lead.grade_display && (
        <div className="mt-5 border-t border-brand-line pt-4 text-sm">
          <span lang={/[А-Яа-яЁё]/.test(lead.grade_display) ? 'ru' : undefined}>
            {lead.grade_display}
          </span>
          {lead.grade_label && (
            <p
              lang={/[А-Яа-яЁё]/.test(lead.grade_label) ? 'ru' : undefined}
              className="mt-1 text-brand-muted"
            >
              {lead.grade_label}
            </p>
          )}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-brand-line pt-5 text-sm">
        <p className="text-brand-muted">
          {lead.status === 'SOLD'
            ? t('leadCard.badge.sold')
            : free
              ? t('leadCard.badge.free')
              : t('leadDetail.statusPending')}
          <span className="block">
            {formatCheckDate(lead.last_verified, loc)}
          </span>
        </p>
        <Link
          href={`/${locale}/leads/${lead.code}`}
          className="brand-focus inline-flex min-h-11 items-center gap-2 font-semibold hover:underline"
        >
          {t('leadCard.open')}{' '}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
