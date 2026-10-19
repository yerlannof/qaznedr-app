import { isCoalShowcase, type Showcase } from '@/lib/leads/showcase';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

/**
 * Verbatim showcase disclaimers (geobase contracts); must not be shortened.
 * Metal and coal cards carry different ones: shown cards pick which apply.
 */
export default function ShowcaseDisclaimer({
  locale,
  cards,
}: {
  locale: Locale;
  cards?: Pick<Showcase, 'commodity'>[];
}) {
  const coal = cards?.some(isCoalShowcase) ?? false;
  const metals = !cards || cards.some((c) => !isCoalShowcase(c));
  return (
    <aside
      aria-label={translate(locale, 'showcase.disclaimerLabel')}
      className="mt-10 space-y-3 border border-brand-line bg-brand-surface p-5 text-sm leading-relaxed"
    >
      {metals && <p>{translate(locale, 'showcase.disclaimer')}</p>}
      {coal && <p>{translate(locale, 'showcase.disclaimerCoal')}</p>}
    </aside>
  );
}
