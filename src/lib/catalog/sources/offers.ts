import type { AssetOffer } from '@/lib/offers/contract';
import type { CatalogItem } from '../types';

export function fromAssetOffer(offer: AssetOffer): CatalogItem {
  return {
    kind: 'asset',
    code: offer.code,
    path: `/offers/${offer.code}`,
    commodityGroup: offer.commodity_group,
    commodities: offer.commodity,
    region: offer.region,
    stage: offer.stage,
    hasInfrastructure: offer.has_infrastructure,
    publishedAt: offer.published_at,
    sortOrder: offer.sort_order,
  };
}
