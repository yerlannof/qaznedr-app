import {
  parseEquipmentSearchQuery,
  equipmentSearchRpcArgs,
  normalizeEquipmentSearchText,
} from '@/lib/equipment-listings/search';

const parse = (query: string) =>
  parseEquipmentSearchQuery(new URLSearchParams(query));

describe('closed equipment catalogue query boundary', () => {
  it('uses bounded pagination and an explicit sort allowlist', () => {
    expect(parse('')).toMatchObject({ page: 1, limit: 20, sort: 'NEWEST' });
    for (const query of [
      'page=0',
      'page=1001',
      'limit=51',
      'limit=0',
      'page=1.5',
      'page=1e2',
      'sort=owner_id',
      'sort=PRICE_ASC',
      'sort=PRICE_ASC&currency=KZT',
    ])
      expect(() => parse(query)).toThrow();
    expect(
      parse('sort=PRICE_ASC&currency=KZT&priceUnit=HOUR&limit=50&page=2')
    ).toMatchObject({
      sort: 'PRICE_ASC',
      currency: 'KZT',
      priceUnit: 'HOUR',
      limit: 50,
      page: 2,
    });
  });

  it('rejects unknown, private, duplicated and ambiguous query parameters', () => {
    for (const query of [
      'status=DRAFT',
      'ownerId=owner',
      'phone=7000000000',
      'method=CORE&method=RC',
      'category=drill&category=drill',
      'method=unknown',
      'operator=maybe',
      'depth=500m',
      'depth=Infinity',
      'diameter=0',
      'bucket=-1',
      'schemaVersion=1',
    ])
      expect(() => parse(query)).toThrow();
  });

  it('keeps drilling method, requested depth and exact borehole diameter together', () => {
    const filters = parse('category=drill&method=CORE&depth=500&diameter=96');
    expect(equipmentSearchRpcArgs(filters)).toMatchObject({
      p_method: 'CORE',
      p_depth: 500,
      p_diameter: 96,
    });
    // Diameter is the actual borehole size, not an unsubstantiated maximum.
    expect(() => parse('category=compressor&depth=500')).toThrow();
    expect(() => parse('category=excavator&method=CORE')).toThrow();
  });

  it('checks offer/category and category-specific units', () => {
    expect(() => parse('offerType=SALE&category=drillService')).toThrow();
    expect(() => parse('offerType=SERVICE&category=drill')).toThrow();
    expect(() => parse('category=drill&pressure=8')).toThrow();
    expect(() => parse('category=compressor&payload=12')).toThrow();
    expect(
      parse('category=compressor&pressure=8&flow=20&delivery=true')
    ).toMatchObject({
      pressure: 8,
      flow: 20,
      delivery: true,
    });
  });

  it('accepts unknown category when searching across categories, and no zero placeholders', () => {
    expect(parse('method=RC&depth=200&operator=false')).toMatchObject({
      method: 'RC',
      depth: 200,
      operator: false,
    });
    expect(() => parse('depth=0')).toThrow();
    expect(() =>
      parse('sort=PRICE_ASC&currency=KZT&priceUnit=SHIFT')
    ).toThrow();
    expect(
      parse('sort=PRICE_ASC&currency=KZT&priceUnit=SHIFT&shiftHours=8')
        .shiftHours
    ).toBe(8);
  });

  it('normalizes typography and method aliases without searching private contacts', () => {
    expect(normalizeEquipmentSearchText('  КЕРНОВОЕ   ＣＯＲＥ  Ё  ')).toBe(
      'core core е'
    );
    expect(parse('q=RC%20Sandvik')).toMatchObject({
      tokens: ['rc', 'sandvik'],
    });
    expect(parse('q=керновое%20бурение')).toMatchObject({
      tokens: ['core', 'бурение'],
    });
    expect(() => parse('q=' + 'x'.repeat(161))).toThrow();
    expect(() => parse('q=a%00b')).toThrow();
  });

  it('never interpolates free text into PostgREST expressions or SQL', () => {
    const text = "XY-1'); DROP TABLE equipment_listings; --";
    const args = equipmentSearchRpcArgs(parse('q=' + encodeURIComponent(text)));
    expect(args.p_tokens).toEqual(
      normalizeEquipmentSearchText(text).split(' ')
    );
    expect(args).not.toHaveProperty('sql');
    expect(args.p_offset).toBe(0);
    expect(args.p_limit).toBe(20);
  });

  it('filters core sizes, site, trajectory, chassis and sale condition independently', () => {
    expect(
      equipmentSearchRpcArgs(
        parse(
          'category=drill&method=CORE&coreSize=HQ&site=SURFACE&trajectory=INCLINED&chassis=TRACKED'
        )
      )
    ).toMatchObject({
      p_core_size: 'HQ',
      p_site: 'SURFACE',
      p_trajectory: 'INCLINED',
      p_chassis: 'TRACKED',
    });
    expect(
      parse('offerType=SALE&machineCondition=USED&minYear=2010&maxYear=2026')
    ).toMatchObject({ machineCondition: 'USED', minYear: 2010, maxYear: 2026 });
    for (const query of [
      'method=RC&coreSize=HQ',
      'category=compressor&site=SURFACE',
      'category=transport&chassis=TRACKED',
      'offerType=RENT&machineCondition=USED',
      'minYear=2026&maxYear=2010',
    ])
      expect(() => parse(query)).toThrow();
  });
});
