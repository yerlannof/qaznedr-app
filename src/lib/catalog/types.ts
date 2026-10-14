import type { Localized } from '@/lib/leads/showcase';

// One row of the unified catalogue (/leads, approved design 18). Every source
// — our finds (showcase leads), artisanal-mining plots, assets for sale —
// adapts its own data into this shape for filtering and counting. Cards are
// still rendered by each source's own component from its own data, so a
// source's approved wording is never recomposed here.

export const CATALOG_KINDS = ['asset', 'find', 'prospecting'] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

/** ТПИ metals vs ОПИ construction materials. */
export const COMMODITY_GROUPS = ['metals_tpi', 'opi'] as const;
export type CommodityGroup = (typeof COMMODITY_GROUPS)[number];

/** Occurrence (our finds), exploration licence, artisanal mining, operating production. */
export const CATALOG_STAGES = [
  'occurrence',
  'exploration',
  'prospecting',
  'production',
] as const;
export type CatalogStage = (typeof CATALOG_STAGES)[number];

export interface CatalogItem {
  kind: CatalogKind;
  /** Public code, unique across the catalogue (QN-04, QN-A01, QN-P07). */
  code: string;
  /** Locale-free detail path, e.g. '/offers/QN-A01'. */
  path: string;
  commodityGroup: CommodityGroup;
  /** Element symbols ('Au', 'Zn', 'Pb'), 'stone' for construction stone or 'tuff'. */
  commodities: string[];
  /** Region id from src/lib/data/filter-config.ts REGIONS. */
  region: string | null;
  stage: CatalogStage;
  hasInfrastructure: boolean;
  /** ISO date the item went public; newest first in the default order. */
  publishedAt: string | null;
  /** Package order inside one source; lower comes first. */
  sortOrder: number;
  areaHa?: number;
  /** ISO date the right is valid until. */
  validUntil?: string;
  district?: Localized;
  status?: 'open' | 'matched';
}
