'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { getContactConfig, whatsappLink } from '@/lib/config/contacts';
import { safeTrack } from '@/lib/analytics/events';

/** Approved service copy and contour motif; no map data is published here. */
export default function GeologicalSupport({
  locale,
  compact = false,
}: {
  locale: string;
  compact?: boolean;
}) {
  const t = (key: string) => translate(locale, key);
  const config = getContactConfig();
  const contact = `/${locale}/contact?service=geology`;
  const wechat = locale === 'zh' && (config.wechatId || config.wechatQrSrc);
  const whatsapp = compact && locale !== 'zh' && config.whatsappNumber;
  const message = `${t('contact.whatsappTextGeneral')}\n${t('holdingServices.geology.title')}`;
  const href = whatsapp ? whatsappLink(whatsapp, message) : contact;
  const label = compact
    ? wechat
      ? 'mapSupport.wechat'
      : whatsapp
        ? 'mapSupport.whatsapp'
        : 'mapSupport.action'
    : 'mapSupport.action';

  return (
    <section
      className="bg-brand-bg text-brand-ink"
      aria-labelledby="map-support-title"
    >
      <div className="brand-container pb-24 pt-10 lg:py-16">
        <div
          className="mb-8 flex items-center gap-3 md:gap-5"
          aria-hidden="true"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-line font-serif text-xl">
            02
          </span>
          <svg
            className="h-12 w-20 shrink-0 md:w-28"
            viewBox="0 0 120 58"
            fill="none"
            focusable="false"
          >
            <path
              d="M2 32 C22 6 50 8 68 26 S103 53 118 15 M9 45 C28 19 47 22 64 38 S99 60 111 32 M17 56 C33 35 47 38 59 49"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <span className="h-px flex-1 bg-brand-line" />
          <span className="max-w-36 text-xs text-brand-muted">
            {t('holdingServices.geology.title')}
          </span>
        </div>
        <div
          className={
            compact
              ? 'grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end'
              : 'max-w-3xl'
          }
        >
          <div>
            <h2
              id="map-support-title"
              className="font-serif text-3xl leading-tight md:text-4xl"
            >
              {t(compact ? 'mapSupport.ctaTitle' : 'mapSupport.title')}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-muted">
              {t(compact ? 'mapSupport.cta' : 'mapSupport.body')}
            </p>
            {!compact && (
              <>
                <p className="mt-5 text-base leading-relaxed text-brand-muted">
                  {t('mapSupport.inputs')}
                </p>
                <p className="mt-6 border-l border-brand-line pl-4 text-sm leading-relaxed text-brand-muted">
                  {t('mapSupport.limits')}
                </p>
              </>
            )}
          </div>
          <Link
            href={href}
            target={whatsapp ? '_blank' : undefined}
            rel={whatsapp ? 'noopener noreferrer' : undefined}
            onClick={
              whatsapp
                ? () =>
                    safeTrack('click_whatsapp', {
                      locale,
                      topic: 'geology',
                      place: 'map_support',
                    })
                : undefined
            }
            className={`brand-button brand-focus w-fit ${compact ? '' : 'mt-7'}`}
          >
            {t(label)}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
