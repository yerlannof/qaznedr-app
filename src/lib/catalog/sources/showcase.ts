import { showcaseRegionId } from '@/lib/leads/showcase-regions';
import { isCoalShowcase, type Showcase } from '@/lib/leads/showcase';
import type { LeadTeaser } from '@/lib/leads/types';
import type { CatalogItem } from '../types';

/**
 * Our finds: metal ore occurrences (ТПИ), or coal deposits with a historical
 * Soviet reserve estimate (coal package).
 */
export function fromShowcaseLead(
  lead: LeadTeaser,
  card: Showcase
): CatalogItem {
  const coal = isCoalShowcase(card);
  return {
    kind: 'find',
    code: card.card_id,
    path: `/leads/${card.card_id}`,
    commodityGroup: coal ? 'coal' : 'metals_tpi',
    commodities: card.commodity,
    region: showcaseRegionId(card.oblast.ru) ?? null,
    stage: coal ? 'deposit' : 'occurrence',
    hasInfrastructure: false,
    // The teaser select carries no published_at; the rights check date is
    // when the card's current wording went live.
    publishedAt: card.rights.checked_at,
    sortOrder: lead.sort_order ?? 0,
  };
}
