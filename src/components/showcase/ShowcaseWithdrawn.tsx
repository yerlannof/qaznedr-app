import Link from 'next/link';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

/** Neutral notice for a withdrawn card: no reason, no status words. */
export default function ShowcaseWithdrawn({ locale }: { locale: Locale }) {
  return (
    <div className="brand-container py-16 lg:py-24">
      <h1 className="holding-title max-w-3xl">
        {translate(locale, 'showcase.withdrawn')}
      </h1>
      <Link
        href={`/${locale}/leads`}
        className="brand-button-secondary brand-focus mt-8"
      >
        {translate(locale, 'leadDetail.breadcrumbLeads')}
      </Link>
    </div>
  );
}
