import ShowcaseCard from './ShowcaseCard';
import ShowcaseDisclaimer from './ShowcaseDisclaimer';
import ZoneMap from './ZoneMap';
import { translate } from '@/lib/i18n/translations';
import type { ContactConfig } from '@/lib/config/contacts';
import { parseShowcase, type Showcase } from '@/lib/leads/showcase';
import type { LeadTeaser } from '@/lib/leads/types';
import type { Locale } from '@/lib/seo/site';

export function showcaseCards(leads: LeadTeaser[]): Showcase[] {
  return leads.flatMap((lead) => {
    const card = parseShowcase(lead.showcase);
    return card ? [card] : [];
  });
}

export function legacyLeads(leads: LeadTeaser[]): LeadTeaser[] {
  return leads.filter((lead) => !parseShowcase(lead.showcase));
}

/** Overview scheme, the cards in package order and the verbatim disclaimer. */
export default function ShowcaseList({
  leads,
  locale,
  contacts,
  overview = true,
}: {
  leads: LeadTeaser[];
  locale: Locale;
  contacts: ContactConfig;
  overview?: boolean;
}) {
  const cards = showcaseCards(leads);
  if (!cards.length) return null;
  return (
    <div>
      {overview && (
        <figure className="m-0 border-y border-brand-line py-6">
          <ZoneMap
            zones={cards.map((c) => c.zone)}
            label={translate(locale, 'showcase.overviewLabel')}
            className="mx-auto max-w-4xl"
          />
          <figcaption className="mt-3 text-sm text-brand-muted">
            {translate(locale, 'showcase.overviewCaption')}
            <span className="mt-1 block text-xs">
              {translate(locale, 'showcase.mapCredit')}
            </span>
          </figcaption>
        </figure>
      )}
      <div>
        {cards.map((card) => (
          <ShowcaseCard
            key={card.card_id}
            showcase={card}
            locale={locale}
            contacts={contacts}
          />
        ))}
      </div>
      <ShowcaseDisclaimer locale={locale} />
    </div>
  );
}
