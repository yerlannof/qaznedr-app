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
  cards?: (Pick<Showcase, 'commodity'> & Partial<Pick<Showcase, 'rights'>>)[];
}) {
  const coal = cards?.some(isCoalShowcase) ?? false;
  const metalCards = cards?.filter((c) => !isCoalShowcase(c));
  const metals = !metalCards || metalCards.length > 0;
  // The rights sentence is dropped only when no shown metal card prints rights.
  const noRights =
    !!metalCards &&
    metalCards.length > 0 &&
    metalCards.every((c) => c.rights && !c.rights.status);
  return (
    <aside
      aria-label={translate(locale, 'showcase.disclaimerLabel')}
      className="mt-10 space-y-3 border border-brand-line bg-brand-surface p-5 text-sm leading-relaxed"
    >
      {metals && (
        <p>
          {translate(
            locale,
            noRights ? 'showcase.disclaimerNoRights' : 'showcase.disclaimer'
          )}
        </p>
      )}
      {coal && <p>{translate(locale, 'showcase.disclaimerCoal')}</p>}
    </aside>
  );
}
