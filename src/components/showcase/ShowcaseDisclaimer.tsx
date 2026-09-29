import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

/** Verbatim showcase disclaimer (geobase contract); must not be shortened. */
export default function ShowcaseDisclaimer({ locale }: { locale: Locale }) {
  return (
    <aside
      aria-label={translate(locale, 'showcase.disclaimerLabel')}
      className="mt-10 border border-brand-line bg-brand-surface p-5 text-sm leading-relaxed"
    >
      <p>{translate(locale, 'showcase.disclaimer')}</p>
    </aside>
  );
}
