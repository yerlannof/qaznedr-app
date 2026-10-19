import Image from 'next/image';
import Link from 'next/link';
import { SCENES } from '@/lib/brand/photos';
import { ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { ServiceTopic } from '@/lib/services/topics';
import { guideContactHref } from '@/lib/insights/contact-context';

/** Closing dark band: view the areas or contact us. Hook-free (RSC-safe). */
export default function ClosingCta({
  locale,
  variant = 'legacy',
  serviceTopic,
  guideSlug,
}: {
  locale: string;
  variant?: 'legacy' | 'brand';
  serviceTopic?: ServiceTopic;
  guideSlug?: string;
}) {
  const t = (key: string) => translate(locale, key);
  const isBrand = variant === 'brand';
  if (isBrand) {
    // Photo band (owner redesign 2026-10-20): mountains behind the CTA.
    return (
      <section className="photo-band">
        <Image
          src={SCENES.foothills}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="photo-band-scrim" aria-hidden="true" />
        <div className="relative z-[1] brand-container py-20 lg:py-32">
          <h2 className="font-serif font-light max-w-[16ch] text-[34px] md:text-[48px] lg:text-[60px] leading-[1.04] tracking-[-0.025em]">
            {t('insights.ctaTitle')}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-brand-chalk/85">
            {t('insights.ctaText')}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/leads`}
              className="brand-button brand-focus"
            >
              {t('insights.ctaLeads')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href={guideContactHref(locale, guideSlug, serviceTopic)}
              className="brand-button-secondary home-hero-ghost brand-focus"
            >
              {t('insights.ctaContact')}
            </Link>
          </div>
        </div>
        <span className="absolute z-[1] right-5 bottom-3 text-[11px] text-brand-chalk/55">
          {t('homeV2.illustration')}
        </span>
      </section>
    );
  }
  return (
    <section
      className={
        isBrand
          ? 'border-t border-brand-line bg-brand-surface text-brand-ink'
          : 'bg-[#0A0A0A] text-white border-t border-gray-100 dark:border-gray-800'
      }
    >
      <div
        className={
          isBrand
            ? 'brand-container max-w-[760px] py-16 lg:py-20 text-left'
            : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-left'
        }
      >
        <h2
          className={
            isBrand
              ? 'font-serif text-3xl lg:text-4xl font-light tracking-tight text-brand-ink'
              : 'font-serif text-3xl lg:text-4xl font-light tracking-tight text-white'
          }
        >
          {t('insights.ctaTitle')}
        </h2>
        <p
          className={
            isBrand
              ? 'mt-4 text-brand-muted max-w-xl'
              : 'mt-4 text-gray-400 max-w-xl'
          }
        >
          {t('insights.ctaText')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/leads`}
            className={
              isBrand
                ? 'brand-button brand-focus'
                : 'inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200'
            }
          >
            {t('insights.ctaLeads')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href={guideContactHref(locale, guideSlug, serviceTopic)}
            className={
              isBrand
                ? 'brand-button-secondary brand-focus'
                : 'inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors duration-150'
            }
          >
            {t('insights.ctaContact')}
          </Link>
        </div>
      </div>
    </section>
  );
}
