import { parseEquipmentSearchQuery, type EquipmentSearchQuery } from './search';
import { CATEGORY_GROUPS, type CategoryGroup } from './taxonomy';

/** Query keys the public catalogue understands; everything else is dropped. */
const KEYS = [
  'offerType',
  'category',
  'region',
  'kind',
  'serviceMethod',
  'accredited',
  'page',
] as const;
// Filters that only make sense together with a section or offer type.
const DEPENDENT = ['kind', 'serviceMethod', 'accredited', 'offerType'] as const;

type Raw = Record<string, string | string[] | undefined>;

function pick(raw: Raw, drop: readonly string[] = []): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of KEYS) {
    if (drop.includes(key)) continue;
    const value = raw[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === 'string' && single.trim() && single.length <= 64)
      params.set(key, single.trim());
  }
  params.set('limit', '24');
  return params;
}

/**
 * Parse public catalogue URL params. When a filter left over from another
 * section makes the combination invalid (e.g. a machine type after switching
 * to services), the dependent filters are dropped instead of failing the page.
 */
export function parseCatalogQuery(raw: Raw): {
  query: EquipmentSearchQuery;
  adjusted: boolean;
} {
  try {
    return { query: parseEquipmentSearchQuery(pick(raw)), adjusted: false };
  } catch {
    try {
      return {
        query: parseEquipmentSearchQuery(pick(raw, DEPENDENT)),
        adjusted: true,
      };
    } catch {
      return {
        query: parseEquipmentSearchQuery(new URLSearchParams('limit=24')),
        adjusted: true,
      };
    }
  }
}

/** Only a section and/or region (first page) is worth indexing; deeper combinations are not. */
export function isIndexableQuery(query: EquipmentSearchQuery): boolean {
  return (
    query.page === 1 &&
    !query.offerType &&
    !query.kind &&
    !query.serviceMethod &&
    query.accredited === undefined
  );
}

/**
 * A section tile (`group`) narrows the catalogue to a group of categories.
 * An explicit category wins over the group.
 */
export function parseCatalogGroup(
  raw: Raw,
  query: EquipmentSearchQuery
): CategoryGroup | null {
  const value = Array.isArray(raw.group) ? raw.group[0] : raw.group;
  if (query.category || typeof value !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(CATEGORY_GROUPS, value)
    ? (value as CategoryGroup)
    : null;
}
