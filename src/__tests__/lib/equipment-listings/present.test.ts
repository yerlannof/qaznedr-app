import {
  cardTag,
  keyFacts,
  priceText,
  specRows,
  workAreaText,
} from '@/lib/equipment-listings/present';
import {
  isIndexableQuery,
  parseCatalogQuery,
} from '@/lib/equipment-listings/catalog-query';

const drill = {
  id: '00000000-0000-4000-8000-000000000001',
  offerType: 'RENT',
  category: 'drill',
  title: 'XY-44A',
  region: 'karagandy',
  city: 'Караганда',
  price: 180000,
  currency: 'KZT',
  priceUnit: 'SHIFT',
  shiftHours: 12,
  capabilities: [
    { method: 'CORE', depth: 1200, diameter: 96, coreSize: 'HQ' },
    { method: 'RC', depth: 250 },
  ],
  serviceArea: ['ALL_KZ'],
  updatedAt: '2026-10-15T00:00:00Z',
} as never;
const lab = {
  id: '00000000-0000-4000-8000-000000000002',
  offerType: 'SERVICE',
  category: 'labService',
  title: 'Lab',
  region: 'abai',
  city: 'Семей',
  serviceMethods: ['FIRE_ASSAY', 'ICP_MS', 'XRF'],
  accredited: true,
  updatedAt: '2026-10-15T00:00:00Z',
} as never;

describe('catalogue presentation', () => {
  it('shows price with unit and shift length, or price on request', () => {
    expect(priceText(drill, 'ru')).toMatch(/180\s000\s₸ за смену \(12 ч\)/);
    expect(priceText(drill, 'en')).toMatch(/per shift \(12 h\)/);
    expect(priceText(lab, 'ru')).toBe('Цена по запросу');
  });

  it('builds tags and key facts per section in the visitor language', () => {
    expect(cardTag(drill, 'ru')).toBe('Техника · Аренда');
    expect(cardTag(lab, 'ru')).toBe('Услуги и работы · Лаборатория, анализы');
    expect(keyFacts(drill, 'ru')).toEqual(['Колонковое, 1\u00a0200 м']);
    expect(keyFacts(drill, 'zh')[0]).toContain('米');
    expect(keyFacts(lab, 'ru')).toEqual([
      'Пробирный анализ, ICP-MS…',
      'Аккредитованная лаборатория',
    ]);
    expect(workAreaText(drill, 'ru')).toBe('Весь Казахстан');
  });

  it('lists every drilling capability in the specifications', () => {
    const rows = specRows(drill, 'ru').filter(
      (row) => row.label === 'Возможности бурения'
    );
    expect(rows.map((row) => row.value)).toEqual([
      'Колонковое · 1\u00a0200 м · Ø 96 мм · HQ',
      'Обратная циркуляция · 250 м',
    ]);
  });
});

describe('catalogue query', () => {
  it('drops filters left over from another section instead of failing', () => {
    const { query, adjusted } = parseCatalogQuery({
      category: 'labService',
      kind: 'BULLDOZER',
      region: 'abai',
    });
    expect(adjusted).toBe(true);
    expect(query).toMatchObject({ category: 'labService', region: 'abai' });
    expect(query.kind).toBeUndefined();
    expect(
      parseCatalogQuery({ region: 'Караганда' }).query.region
    ).toBeUndefined();
  });

  it('indexes only section and region pages', () => {
    expect(
      isIndexableQuery(
        parseCatalogQuery({ category: 'drill', region: 'abai' }).query
      )
    ).toBe(true);
    expect(
      isIndexableQuery(
        parseCatalogQuery({ category: 'excavator', kind: 'LOADER' }).query
      )
    ).toBe(false);
    expect(isIndexableQuery(parseCatalogQuery({ page: '2' }).query)).toBe(
      false
    );
  });
});
