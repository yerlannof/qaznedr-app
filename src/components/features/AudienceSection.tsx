'use client';

import Link from 'next/link';
import { Pickaxe, TrendingUp, Compass, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Three-persona orienting section — who the platform is for + which CTA fits.
// Sits below the hero stack to give visitors a clear "this is for me" moment.
export default function AudienceSection({ locale }: { locale: string }) {
  const { t } = useTranslation();

  const personas = [
    {
      key: 'prospector',
      icon: Pickaxe,
      href: `/${locale}/leads`,
    },
    {
      key: 'investor',
      icon: TrendingUp,
      href: `/${locale}/listings`,
    },
    {
      key: 'geologist',
      icon: Compass,
      href: `/${locale}/listings/create`,
    },
  ] as const;

  return (
    <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-gold-dark dark:text-gold-light">
              {t('audience.eyebrow')}
            </span>
          </div>
          <h2 className="font-serif text-3xl lg:text-5xl font-light tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            {t('audience.title')}
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
            {t('audience.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {personas.map(({ key, icon: Icon, href }) => (
            <Link
              key={key}
              href={href}
              className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-7 transition-all hover:border-gold/50 hover:shadow-[0_8px_30px_rgba(200,162,75,0.12)] dark:hover:shadow-[0_8px_30px_rgba(200,162,75,0.18)]"
            >
              {/* corner arrow */}
              <ArrowUpRight className="absolute top-6 right-6 w-4 h-4 text-gray-300 dark:text-gray-700 transition-all group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[rgba(200,162,75,0.10)] text-gold-dark dark:text-gold-light mb-5">
                <Icon className="w-5 h-5" />
              </div>

              <div className="text-[11px] uppercase tracking-[0.18em] text-gold-dark dark:text-gold-light mb-2">
                {t(`audience.${key}.tag`)}
              </div>
              <h3 className="font-serif text-2xl lg:text-[28px] text-gray-900 dark:text-gray-50 leading-tight mb-3">
                {t(`audience.${key}.title`)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
                {t(`audience.${key}.desc`)}
              </p>

              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50 group-hover:text-gold-dark dark:group-hover:text-gold-light transition-colors">
                {t(`audience.${key}.cta`)}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
