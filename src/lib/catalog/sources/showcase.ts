import { showcaseRegionId } from '@/lib/leads/showcase-regions';
import type { Showcase } from '@/lib/leads/showcase';
import type { LeadTeaser } from '@/lib/leads/types';
import type { CatalogItem } from '../types';

/** Our finds: showcase cards are ore occurrences of metals (ТПИ). */
export function fromShowcaseLead(
  lead: LeadTeaser,
  card: Showcase
): CatalogItem {
  return {
    kind: 'find',
    code: card.card_id,
    path: `/leads/${card.card_id}`,
    commodityGroup: 'metals_tpi',
    commodities: card.commodity,
    region: showcaseRegionId(card.oblast.ru) ?? null,
    stage: 'occurrence',
    hasInfrastructure: false,
    // The teaser select carries no published_at; the rights check date is
    // when the card's current wording went live.
    publishedAt: card.rights.checked_at,
    sortOrder: lead.sort_order ?? 0,
  };
}
