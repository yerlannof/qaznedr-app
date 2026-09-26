import {
  mineralHub,
  matchesMineral,
  hubMineralName,
} from '@/lib/leads/minerals';
it('recognizes only known hub slugs', () => {
  expect(mineralHub('gold')?.symbols).toEqual(['Au']);
  expect(mineralHub('unknown')).toBeUndefined();
});
it.each([
  ['Au+Cu', 'gold', true],
  ['Au+Cu', 'copper', true],
  ['Pb-Zn', 'lead-zinc', true],
  ['Zn', 'lead-zinc', true],
  ['Au россыпь', 'gold', true],
  ['W/Mo', 'molybdenum', true],
  ['bauxite', 'gold', false],
  ['Cu', 'gold', false],
  ['Cu', 'unknown', false],
])('matches %s to %s: %s', (raw, slug, expected) => {
  expect(matchesMineral(raw as string, slug as string)).toBe(expected);
});
it('localizes hub names with existing approved mineral names', () => {
  expect(hubMineralName('lead-zinc', 'en')).toBe('Lead-Zinc');
  expect(hubMineralName('copper', 'zh')).toBe('铜');
});
