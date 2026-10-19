'use client';

import Image from 'next/image';
import { keepWords } from '@/lib/i18n/keep-words';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { safeTrack } from '@/lib/analytics/events';
import { translate } from '@/lib/i18n/translations';
import { getContactConfig, primaryContactCta } from '@/lib/config/contacts';

/**
 * Full-bleed home hero (owner redesign 2026-10-20): a slow silent aerial loop
 * under the headline. The footage is a generated illustration, labelled as
 * such; reduced motion and slow connections keep the still poster.
 */
export default function HomeHero({
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
      locale === 'ru' || locale === 'kz' ? ' ' : ','
    );
  const figures = [
    { label: t('portal.statsRegistryLabel'), value: 7152 },
    ...(stats && stats.total > 0
      ? [
          { label: t('portal.statsLeadsLabel'), value: stats.total },
          { label: t('portal.statsRegionsLabel'), value: stats.regions },
        ]
      : []),
  ];
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-media" aria-hidden="true">
        <Image
          src="/brand/photo/hero-ridges.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <video
          className="home-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/brand/photo/hero-ridges.webp"
        >
          <source
            src="/brand/photo/hero-ridges-960.mp4"
            type="video/mp4"
            media="(max-width: 760px)"
          />
          <source src="/brand/photo/hero-ridges.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="home-hero-scrim" aria-hidden="true" />
      <div className="brand-container home-hero-body">
        <div className="max-w-[820px]">
          <p className="holding-eyebrow home-hero-eyebrow">
            {t('portal.eyebrow')}
          </p>
          <h1
            id="home-hero-title"
            className="font-serif font-light mt-5 text-[44px] sm:text-[60px] lg:text-[88px] leading-[1.0] tracking-[-0.03em]"
          >
            {keepWords(
              [
                t('portal.headlineLine1'),
                t('portal.headlineEmphasis'),
                t('portal.headlineLine2'),
              ].join(locale === 'zh' ? '' : ' '),
              locale
            )}
          </h1>
          <p className="mt-6 max-w-[46ch] text-base lg:text-[19px] leading-relaxed text-brand-chalk/85">
            {t('footer.company.description')}
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
                className="brand-button-secondary home-hero-ghost"
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
              <Link
                href={cta.href}
                className="brand-button-secondary home-hero-ghost"
              >
                <MessageCircle aria-hidden className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            )}
          </div>
        </div>
        <dl
          className="home-hero-stats"
          aria-label={t('portal.statsLive')}
          style={{
            gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))`,
          }}
        >
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-xs sm:text-sm text-brand-chalk/70">
                {f.label}
              </dt>
              <dd className="font-serif font-light text-[30px] lg:text-[44px] leading-tight tabular-nums">
                {number(f.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <span className="home-hero-credit">{t('homeV2.illustration')}</span>
    </section>
  );
}
