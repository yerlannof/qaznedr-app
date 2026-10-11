import { mineralHub } from '@/lib/leads/minerals';
import {
  CATALOG_KINDS,
  CATALOG_STAGES,
  COMMODITY_GROUPS,
  type CatalogItem,
  type CatalogKind,
  type CatalogStage,
  type CommodityGroup,
} from './types';

// Facets live in the URL (approved design 18): a filtered list is a plain,
// shareable, crawlable GET page. Multi-values may come repeated
// (?kind=asset&kind=find, from the no-JS form) or comma-joined.

export const CATALOG_SORTS = ['newest', 'area_desc', 'valid_desc'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export interface CatalogParams {
  kinds: CatalogKind[];
  groups: CommodityGroup[];
  commodities: string[];
  regions: string[];
  stages: CatalogStage[];
  infra: boolean;
  sort: CatalogSort;
}

export type FacetKey =
  | 'kinds'
  | 'groups'
  | 'commodities'
  | 'regions'
  | 'stages'
  | 'infra';

type RawParams = Record<string, string | string[] | undefined>;

const MAX_VALUES = 20;

function values(raw: string | string[] | undefined): string[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const out = new Set<string>();
  for (const entry of list)
    for (const part of entry.split(','))
      if (part.trim()) out.add(part.trim().slice(0, 40));
  return Array.from(out).slice(0, MAX_VALUES);
}

function oneOf<T extends string>(allowed: readonly T[], raw: string[]): T[] {
  return raw.filter((v): v is T => (allowed as readonly string[]).includes(v));
}

const SYMBOL = /^(?:[A-Z][a-z]?|stone)$/;
const REGION_ID = /^[a-z]+(?:-[a-z]+)*$/;

export function parseCatalogParams(sp: RawParams): CatalogParams {
  const commodities = values(sp.commodity).filter((v) => SYMBOL.test(v));
  // Old links (?mineral=gold from the metal hubs) keep working.
  for (const slug of values(sp.mineral)) {
    const hub = mineralHub(slug);
    if (hub)
      for (const s of hub.symbols)
        if (!commodities.includes(s)) commodities.push(s);
  }
  const sort = values(sp.sort)[0];
  return {
    kinds: oneOf(CATALOG_KINDS, values(sp.kind)),
    groups: oneOf(COMMODITY_GROUPS, values(sp.group)),
    commodities,
    regions: values(sp.region).filter((v) => REGION_ID.test(v)),
    stages: oneOf(CATALOG_STAGES, values(sp.stage)),
    infra: values(sp.infra)[0] === '1',
    sort: (CATALOG_SORTS as readonly string[]).includes(sort ?? '')
      ? (sort as CatalogSort)
      : 'newest',
  };
}

export const EMPTY_PARAMS: CatalogParams = {
  kinds: [],
  groups: [],
  commodities: [],
  regions: [],
  stages: [],
  infra: false,
  sort: 'newest',
};

/** Canonical query string: fixed key order, comma-joined, defaults omitted. */
export function catalogQuery(p: CatalogParams): string {
  const q = new URLSearchParams();
  if (p.kinds.length) q.set('kind', p.kinds.join(','));
  if (p.groups.length) q.set('group', p.groups.join(','));
  if (p.commodities.length) q.set('commodity', p.commodities.join(','));
  if (p.regions.length) q.set('region', p.regions.join(','));
  if (p.stages.length) q.set('stage', p.stages.join(','));
  if (p.infra) q.set('infra', '1');
  if (p.sort !== 'newest') q.set('sort', p.sort);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function activeFilterCount(p: CatalogParams): number {
  return (
    p.kinds.length +
    p.groups.length +
    p.commodities.length +
    p.regions.length +
    p.stages.length +
    (p.infra ? 1 : 0)
  );
}

function matches(
  item: CatalogItem,
  p: CatalogParams,
  skip?: FacetKey
): boolean {
  if (skip !== 'kinds' && p.kinds.length && !p.kinds.includes(item.kind))
    return false;
  if (
    skip !== 'groups' &&
    p.groups.length &&
    !p.groups.includes(item.commodityGroup)
  )
    return false;
  if (
    skip !== 'commodities' &&
    p.commodities.length &&
    !item.commodities.some((c) => p.commodities.includes(c))
  )
    return false;
  if (
    skip !== 'regions' &&
    p.regions.length &&
    !(item.region && p.regions.includes(item.region))
  )
    return false;
  if (skip !== 'stages' && p.stages.length && !p.stages.includes(item.stage))
    return false;
  if (skip !== 'infra' && p.infra && !item.hasInfrastructure) return false;
  return true;
}

const KIND_ORDER: Record<CatalogKind, number> = {
  asset: 0,
  find: 1,
  prospecting: 2,
};

function compare(a: CatalogItem, b: CatalogItem, sort: CatalogSort): number {
  if (sort === 'area_desc') {
    const d = (b.areaHa ?? -1) - (a.areaHa ?? -1);
    if (d) return d;
  } else if (sort === 'valid_desc') {
    const d = (b.validUntil ?? '').localeCompare(a.validUntil ?? '');
    if (d) return d;
  }
  // Newest first; within one publication date keep each source's package
  // order (the showcase contract forbids re-sorting by impressiveness).
  const d = (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
  if (d) return d;
  if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.code.localeCompare(b.code);
}

export function filterCatalog(
  items: CatalogItem[],
  p: CatalogParams
): CatalogItem[] {
  return items
    .filter((item) => matches(item, p))
    .sort((a, b) => compare(a, b, p.sort));
}

export interface FacetCounts {
  kinds: Record<string, number>;
  groups: Record<string, number>;
  commodities: Record<string, number>;
  regions: Record<string, number>;
  stages: Record<string, number>;
  infra: number;
}

/**
 * Count per option with every other facet applied (standard faceting): the
 * number next to an option is what the list shows after ticking it.
 */
export function facetCounts(
  items: CatalogItem[],
  p: CatalogParams
): FacetCounts {
  const tally = (
    skip: FacetKey,
    keys: (i: CatalogItem) => (string | null)[]
  ) => {
    const out: Record<string, number> = {};
    for (const item of items) {
      if (!matches(item, p, skip)) continue;
      for (const key of new Set(keys(item)))
        if (key) out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  };
  return {
    kinds: tally('kinds', (i) => [i.kind]),
    groups: tally('groups', (i) => [i.commodityGroup]),
    commodities: tally('commodities', (i) => i.commodities),
    regions: tally('regions', (i) => [i.region]),
    stages: tally('stages', (i) => [i.stage]),
    infra: items.filter((i) => i.hasInfrastructure && matches(i, p, 'infra'))
      .length,
  };
}
