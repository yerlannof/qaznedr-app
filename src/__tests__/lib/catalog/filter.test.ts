import {
  activeFilterCount,
  catalogQuery,
  facetCounts,
  filterCatalog,
  parseCatalogParams,
  EMPTY_PARAMS,
} from '@/lib/catalog/filter';
import type { CatalogItem } from '@/lib/catalog/types';

const item = (over: Partial<CatalogItem>): CatalogItem => ({
  kind: 'find',
  code: 'QN-00',
  path: '/leads/QN-00',
  commodityGroup: 'metals_tpi',
  commodities: ['Au'],
  region: 'zhambyl',
  stage: 'occurrence',
  hasInfrastructure: false,
  publishedAt: '2026-09-30',
  sortOrder: 1,
  ...over,
});

const items: CatalogItem[] = [
  item({
    code: 'QN-04',
    commodities: ['Au', 'Zn'],
    region: 'kyzylorda',
    sortOrder: 2,
  }),
  item({ code: 'QN-17', commodities: ['Pb'], sortOrder: 5 }),
  item({
    kind: 'asset',
    code: 'QN-A01',
    path: '/offers/QN-A01',
    commodityGroup: 'opi',
    commodities: ['stone'],
    region: 'almaty-region',
    stage: 'production',
    hasInfrastructure: true,
    publishedAt: '2026-10-11',
  }),
  item({
    kind: 'prospecting',
    code: 'QN-P07',
    region: 'zhetysu',
    stage: 'prospecting',
    publishedAt: '2026-10-11',
    areaHa: 4.96,
    validUntil: '2029-04-05',
  }),
  item({
    kind: 'prospecting',
    code: 'QN-P15',
    region: 'east-kz',
    stage: 'prospecting',
    publishedAt: '2026-10-11',
    areaHa: 4.21,
    validUntil: '2029-09-22',
  }),
];

describe('parseCatalogParams', () => {
  it('reads repeated and comma-joined values and drops unknown ones', () => {
    const p = parseCatalogParams({
      kind: ['asset', 'find,bogus'],
      group: 'opi',
      region: 'almaty-region,<script>',
      commodity: 'Au,stone,DROP TABLE',
      stage: 'production',
      infra: '1',
      sort: 'nope',
    });
    expect(p.kinds).toEqual(['asset', 'find']);
    expect(p.groups).toEqual(['opi']);
    expect(p.regions).toEqual(['almaty-region']);
    expect(p.commodities).toEqual(['Au', 'stone']);
    expect(p.stages).toEqual(['production']);
    expect(p.infra).toBe(true);
    expect(p.sort).toBe('newest');
  });

  it('keeps old metal-hub links (?mineral=lead-zinc)', () => {
    expect(parseCatalogParams({ mineral: 'lead-zinc' }).commodities).toEqual([
      'Pb',
      'Zn',
    ]);
  });

  it('round-trips through the canonical query', () => {
    const p = parseCatalogParams({
      kind: 'asset,find',
      infra: '1',
      sort: 'area_desc',
    });
    expect(catalogQuery(p)).toBe('?kind=asset%2Cfind&infra=1&sort=area_desc');
    expect(
      parseCatalogParams(
        Object.fromEntries(new URLSearchParams(catalogQuery(p)))
      )
    ).toEqual(p);
    expect(catalogQuery(EMPTY_PARAMS)).toBe('');
    expect(activeFilterCount(p)).toBe(3);
  });
});

describe('filterCatalog', () => {
  it('shows everything newest first, keeping package order within a date', () => {
    expect(filterCatalog(items, EMPTY_PARAMS).map((i) => i.code)).toEqual([
      'QN-A01',
      'QN-P07',
      'QN-P15',
      'QN-04',
      'QN-17',
    ]);
  });

  it('ANDs facets and ORs values inside one facet', () => {
    const p = {
      ...EMPTY_PARAMS,
      kinds: ['asset', 'find'] as const,
      commodities: ['Au', 'stone'],
    };
    expect(
      filterCatalog(items, { ...p, kinds: [...p.kinds] }).map((i) => i.code)
    ).toEqual(['QN-A01', 'QN-04']);
    expect(
      filterCatalog(items, { ...EMPTY_PARAMS, infra: true }).map((i) => i.code)
    ).toEqual(['QN-A01']);
  });

  it('sorts plots by area or validity when asked', () => {
    const plots = { ...EMPTY_PARAMS, kinds: ['prospecting' as const] };
    expect(
      filterCatalog(items, { ...plots, sort: 'area_desc' }).map((i) => i.code)
    ).toEqual(['QN-P07', 'QN-P15']);
    expect(
      filterCatalog(items, { ...plots, sort: 'valid_desc' }).map((i) => i.code)
    ).toEqual(['QN-P15', 'QN-P07']);
  });
});

describe('facetCounts', () => {
  it('counts each option with the other facets applied', () => {
    const c = facetCounts(items, { ...EMPTY_PARAMS, kinds: ['find'] });
    // Kind counts ignore the kind filter itself.
    expect(c.kinds).toEqual({ find: 2, asset: 1, prospecting: 2 });
    // Other facets only see finds.
    expect(c.regions).toEqual({ kyzylorda: 1, zhambyl: 1 });
    expect(c.commodities).toEqual({ Au: 1, Zn: 1, Pb: 1 });
    expect(c.infra).toBe(0);
  });
});
