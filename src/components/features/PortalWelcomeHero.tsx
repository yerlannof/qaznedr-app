'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { safeTrack } from '@/lib/analytics/events';
import { translate } from '@/lib/i18n/translations';
import { getContactConfig, primaryContactCta } from '@/lib/config/contacts';

export default function PortalWelcomeHero({
  locale,
  stats,
}: {
  locale: string;
  stats: { total: number; regions: number } | null;
}) {
  const t = (key: string) => translate(locale, key);
  const cta = primaryContactCta(locale, getContactConfig());
  const label = t('portal.ctaContact');
  // Chrome may fall back from kk to en while Node supports kk. Deterministic
  // grouping prevents a server/client text mismatch without hiding the error.
  const number = (value: number) =>
    String(value).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      locale === 'ru' || locale === 'kz' ? '\u00a0' : ','
    );
  return (
    <>
      <section className="brand-container pt-28 pb-14 lg:pt-36 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[.12em] text-brand-muted mb-6">
              {t('portal.eyebrow')}
            </p>
            <h1 className="font-serif font-normal text-[36px] md:text-[46px] lg:text-[64px] leading-[1.08] tracking-tight">
              {[
                t('portal.headlineLine1'),
                t('portal.headlineEmphasis'),
                t('portal.headlineLine2'),
              ].join(locale === 'zh' ? '' : ' ')}
            </h1>
            <p className="holding-lead mt-6 max-w-2xl">
              {t('portal.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href={`/${locale}/leads`} className="brand-button">
                {t('portal.ctaLeads')}
                <ArrowUpRight aria-hidden className="w-5 h-5 shrink-0" />
              </Link>
              {cta.kind === 'whatsapp' ? (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-button-secondary"
                  onClick={() =>
                    safeTrack('click_whatsapp', {
                      locale,
                      lead: '',
                      place: 'hero',
                    })
                  }
                >
                  <MessageCircle aria-hidden className="w-5 h-5 shrink-0" />
                  {label}
                </a>
              ) : (
                <Link href={cta.href} className="brand-button-secondary">
                  <MessageCircle aria-hidden className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            <Image
              src="/brand/archive-to-field-960.webp"
              alt=""
              width={960}
              height={640}
              priority
              sizes="(max-width:1023px) 90vw, 480px"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>
      <section
        className="brand-container pb-14 lg:pb-20"
        aria-label={t('portal.statsLive')}
      >
        <dl className="grid sm:grid-cols-3 gap-8 border-t border-brand-line pt-8">
          <div>
            <dt className="text-sm text-brand-muted">
              {t('portal.statsRegistryLabel')}
            </dt>
            <dd className="font-serif text-5xl mt-3 tabular-nums">
              {number(7152)}
            </dd>
          </div>
          {stats && stats.total > 0 && (
            <>
              <div>
                <dt className="text-sm text-brand-muted">
                  {t('portal.statsLeadsLabel')}
                </dt>
                <dd className="font-serif text-5xl mt-3 tabular-nums">
                  {number(stats.total)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-brand-muted">
                  {t('portal.statsRegionsLabel')}
                </dt>
                <dd className="font-serif text-5xl mt-3 tabular-nums">
                  {number(stats.regions)}
                </dd>
              </div>
            </>
          )}
        </dl>
        <p className="text-sm text-brand-muted mt-7 max-w-2xl">
          {t('portal.statsCaption')}
        </p>
      </section>
    </>
  );
}
