'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useTranslation } from '@/hooks/useTranslation';
import { getContactConfig, primaryContactCta } from '@/lib/config/contacts';
import { leadRegionName } from '@/lib/seo/lead-metadata';

// Ore objects in the holding's registry (owner-confirmed figure, 2026-09-26).
const REGISTRY_OBJECTS = 7152;
const NUMBER_LOCALE: Record<string, string> = {
  ru: 'ru-RU',
  kz: 'ru-RU',
  en: 'en-US',
  zh: 'zh-CN',
};

// Portal-level welcome hero — editorial gold-on-ink aesthetic with mission statement.
// Sits above LeadsHomeHero on the homepage to set tone for the whole platform.
// Always dark for editorial gravitas (subsoil/geology subject); rest of page respects theme.
export default function PortalWelcomeHero({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const [leadsCount, setLeadsCount] = useState(31);
  const [regionsCount, setRegionsCount] = useState(9);

  useEffect(() => {
    fetch('/api/leads?limit=100')
      .then((r) => r.json())
      .then((j) => {
        const total = Number(j?.data?.total ?? 0);
        const leads: { region?: string | null }[] = j?.data?.leads ?? [];
        const regions = new Set(
          leads
            .map(
              (l) => leadRegionName(l.region, 'ru') || (l.region ?? '').trim()
            )
            .filter(Boolean)
        );
        if (total > 0) setLeadsCount(total);
        if (regions.size > 0) setRegionsCount(regions.size);
      })
      .catch(() => {});
  }, []);

  const cta = primaryContactCta(locale, getContactConfig());
  const ctaLabel = t(
    cta.kind === 'whatsapp'
      ? 'portal.ctaWhatsapp'
      : cta.kind === 'wechat'
        ? 'portal.ctaWechat'
        : 'portal.ctaContact'
  );
  const registry = new Intl.NumberFormat(
    NUMBER_LOCALE[locale] ?? 'ru-RU'
  ).format(REGISTRY_OBJECTS);

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      {/* Atmospheric background layers */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {/* Warm gold mesh — top-right */}
        <div
          className="absolute -top-40 -right-40 w-[760px] h-[760px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(200,162,75,0.22) 0%, rgba(200,162,75,0.05) 35%, transparent 65%)',
          }}
        />
        {/* Cool depth — bottom-left */}
        <div
          className="absolute -bottom-32 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(10,132,255,0.10) 0%, transparent 60%)',
          }}
        />
        {/* Topographic contour overlay — geological motif */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="qz-contour"
              x="0"
              y="0"
              width="240"
              height="240"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0,100 Q60,70 120,100 T240,100"
                fill="none"
                stroke="#C8A24B"
                strokeWidth="0.6"
              />
              <path
                d="M0,130 Q60,100 120,130 T240,130"
                fill="none"
                stroke="#C8A24B"
                strokeWidth="0.6"
              />
              <path
                d="M0,160 Q60,130 120,160 T240,160"
                fill="none"
                stroke="#C8A24B"
                strokeWidth="0.6"
              />
              <path
                d="M0,70 Q60,40 120,70 T240,70"
                fill="none"
                stroke="#C8A24B"
                strokeWidth="0.5"
              />
              <path
                d="M0,40 Q60,15 120,40 T240,40"
                fill="none"
                stroke="#C8A24B"
                strokeWidth="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#qz-contour)" />
        </svg>
        {/* Grain noise for depth */}
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Editorial column — left, ~60% */}
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-3 mb-7 px-4 py-2 rounded-full border border-gold/40 bg-[rgba(200,162,75,0.08)] opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none"
              style={{ animation: 'qzFadeUp 0.6s ease-out forwards' }}
            >
              <span className="w-2 h-2 rounded-full bg-gold border border-gold-light/40" />
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-gold-light">
                {t('portal.eyebrow')}
              </span>
            </div>

            <h1
              className={`font-serif ${
                // CJK glyphs are much wider: at 5rem the zh headline breaks mid-word.
                locale === 'zh'
                  ? 'text-3xl sm:text-4xl lg:text-6xl leading-[1.2]'
                  : 'text-4xl sm:text-5xl lg:text-[5rem] leading-[1.04]'
              } tracking-tight font-light text-white opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none`}
              style={{ animation: 'qzFadeUp 0.7s 0.1s ease-out forwards' }}
            >
              {t('portal.headlineLine1')}{' '}
              <span className="italic text-gold-light">
                {t('portal.headlineEmphasis')}
              </span>{' '}
              {t('portal.headlineLine2')}
            </h1>

            <p
              className="mt-6 text-base lg:text-lg text-gray-300 max-w-2xl leading-relaxed opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none"
              style={{ animation: 'qzFadeUp 0.7s 0.2s ease-out forwards' }}
            >
              {t('portal.subtitle')}
            </p>

            <div
              className="mt-10 flex flex-wrap items-center gap-3 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none"
              style={{ animation: 'qzFadeUp 0.7s 0.3s ease-out forwards' }}
            >
              {cta.kind === 'whatsapp' ? (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('click_whatsapp', { lead: '', place: 'hero' })
                  }
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-[#0A0A0A] text-sm font-semibold hover:bg-gold-light transition-colors"
                >
                  <MessageCircle aria-hidden className="w-4 h-4" />
                  {ctaLabel}
                </a>
              ) : (
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-[#0A0A0A] text-sm font-semibold hover:bg-gold-light transition-colors"
                >
                  <MessageCircle aria-hidden className="w-4 h-4" />
                  {ctaLabel}
                </Link>
              )}
              <Link
                href={`/${locale}/leads`}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gold/40 text-gold-light text-sm font-semibold hover:bg-[rgba(200,162,75,0.08)] transition-colors"
              >
                {t('portal.ctaLeads')}
                <ArrowRight
                  aria-hidden
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          {/* Stats card — right, ~40% */}
          <div
            className="lg:col-span-5 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none"
            style={{ animation: 'qzFadeUp 0.7s 0.4s ease-out forwards' }}
          >
            <div className="relative">
              <div className="relative rounded-2xl border border-gold/30 bg-black/50 backdrop-blur-sm p-7 lg:p-8">
                <div className="flex items-center gap-2 mb-7">
                  <span className="inline-flex w-2 h-2 rounded-full bg-gold border border-gold-light/40" />
                  <span className="text-[11px] uppercase tracking-[0.22em] text-gold-light">
                    {t('portal.statsLive')}
                  </span>
                </div>

                <div className="space-y-5">
                  <StatRow
                    label={t('portal.statsLeadsLabel')}
                    value={leadsCount}
                  />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <StatRow
                    label={t('portal.statsRegistryLabel')}
                    value={registry}
                  />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <StatRow
                    label={t('portal.statsRegionsLabel')}
                    value={regionsCount}
                  />
                </div>

                <p className="mt-7 pt-5 border-t border-white/10 text-[12px] text-gray-500 leading-relaxed">
                  {t('portal.statsCaption')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip — subtle, below the main grid */}
        <div
          className="mt-16 pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none"
          style={{ animation: 'qzFadeUp 0.7s 0.5s ease-out forwards' }}
        >
          {(['verified', 'archive', 'gates', 'discipline'] as const).map(
            (key) => (
              <div key={key} className="text-[13px]">
                <div className="text-gold-light font-semibold mb-1">
                  {t(`portal.trust.${key}Title`)}
                </div>
                <div className="text-gray-500 leading-snug">
                  {t(`portal.trust.${key}Desc`)}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes qzFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-gray-400 leading-tight">{label}</span>
      <span className="font-serif text-3xl lg:text-4xl text-gold-light tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}
