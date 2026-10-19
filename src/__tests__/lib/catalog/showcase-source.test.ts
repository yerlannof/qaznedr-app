import { fromShowcaseLead } from '@/lib/catalog/sources/showcase';
import { filterCatalog, parseCatalogParams } from '@/lib/catalog/filter';
import { leadMineralName } from '@/lib/seo/lead-metadata';
import type { LeadTeaser } from '@/lib/leads/types';
import { fakeShowcase } from '../../mocks/showcase-fixture';

const lead = { sort_order: 1 } as LeadTeaser;
const coal = { ...fakeShowcase, card_id: 'QN-101', commodity: ['coal'] };

it('keeps metal finds as ТПИ ore occurrences', () => {
  const item = fromShowcaseLead(lead, fakeShowcase);
  expect(item.commodityGroup).toBe('metals_tpi');
  expect(item.stage).toBe('occurrence');
});

it('files coal finds under coal deposits, not metals or ore occurrences', () => {
  const item = fromShowcaseLead(lead, coal);
  expect(item.commodityGroup).toBe('coal');
  expect(item.stage).toBe('deposit');
  expect(item.commodities).toEqual(['coal']);
});

it('filters the catalogue by ?commodity=coal and ?group=coal', () => {
  const items = [
    fromShowcaseLead(lead, fakeShowcase),
    fromShowcaseLead(lead, coal),
  ];
  for (const query of [{ commodity: 'coal' }, { group: 'coal' }]) {
    const shown = filterCatalog(items, parseCatalogParams(query));
    expect(shown.map((i) => i.code)).toEqual(['QN-101']);
  }
});

it('names coal in every locale', () => {
  expect(leadMineralName('coal', 'ru')).toBe('Уголь');
  expect(leadMineralName('coal', 'kz')).toBe('Көмір');
  expect(leadMineralName('coal', 'en')).toBe('Coal');
  expect(leadMineralName('coal', 'zh')).toBe('煤炭');
});
