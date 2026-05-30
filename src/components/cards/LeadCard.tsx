'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MapPin, Gem, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { type LeadTeaser, isFreeStatus } from '@/lib/leads/types';
import { useTranslation } from '@/hooks/useTranslation';

// Presentational client component — teaser only. No private fields on LeadTeaser.
// Client so we can localize UI strings via useTranslation hook.
export default function LeadCard({
  lead,
  locale,
}: {
  lead: LeadTeaser;
  locale: string;
}) {
  const { t } = useTranslation();
  const free = isFreeStatus(lead.license_status);
  const isSold = lead.status === 'SOLD';
  const typeLabel =
    t(`leadCard.types.${lead.type}`) === `leadCard.types.${lead.type}`
      ? t('leadCard.types.other')
      : t(`leadCard.types.${lead.type}`);

  return (
    <Link href={`/${locale}/leads/${lead.code}`} className="group block">
      <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] shadow-subtle hover:border-gold/60 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Header / icon area */}
        <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#141414] shadow-subtle flex items-center justify-center">
            <Gem className="w-8 h-8 text-gold" />
          </div>
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isSold ? (
              <Badge variant="default">{t('leadCard.badge.sold')}</Badge>
            ) : free ? (
              <Badge variant="gold">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {t('leadCard.badge.free')}
              </Badge>
            ) : null}
            <Badge variant="blue">{lead.mineral}</Badge>
          </div>
          {lead.region && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 dark:bg-[#141414]/95 backdrop-blur text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60">
              <MapPin className="w-3 h-3" />
              {lead.region}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {typeLabel} · {lead.code}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mt-1.5 line-clamp-2">
            {lead.teaser_title ||
              t('leadCard.titleFallback', {
                region: lead.region || t('leadCard.regionFallback'),
              })}
          </h3>

          {lead.grade_display && (
            <div className="mt-2">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lead.grade_display}
              </span>
              {lead.grade_label && (
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5 line-clamp-1">
                  {lead.grade_label}
                </p>
              )}
            </div>
          )}

          {lead.reserve_categories && lead.reserve_categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.reserve_categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-300"
                >
                  {t('leadCard.categoryPrefix')} {c}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex items-center justify-between mt-auto">
            <span className="text-sm font-bold text-gold-dark dark:text-gold-light">
              {lead.price_display || t('leadCard.priceOnRequest')}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0A84FF] group-hover:gap-1.5 transition-all">
              <Lock className="w-3 h-3" />
              {t('leadCard.open')}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
