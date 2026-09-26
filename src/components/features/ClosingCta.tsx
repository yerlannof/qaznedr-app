import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { ServiceTopic } from '@/lib/services/topics';

/** Closing dark band: view the areas or contact us. Hook-free (RSC-safe). */
export default function ClosingCta({
  locale,
  variant = 'legacy',
  serviceTopic,
}: {
  locale: string;
  variant?: 'legacy' | 'brand';
  serviceTopic?: ServiceTopic;
}) {
  const t = (key: string) => translate(locale, key);
  const isBrand = variant === 'brand';
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
            href={`/${locale}/contact${serviceTopic ? `?service=${serviceTopic}` : ''}`}
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
