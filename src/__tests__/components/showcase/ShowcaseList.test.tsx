jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
import { legacyLeads, showcaseCards } from '@/components/showcase/ShowcaseList';
import type { LeadTeaser } from '@/lib/leads/types';
import { fakeShowcase } from '../../mocks/showcase-fixture';

const row = (code: string, showcase: unknown) =>
  ({ code, showcase }) as unknown as LeadTeaser;

it('hides an unparsable showcase row instead of rendering it as a legacy card', () => {
  const rows = [
    row('QN-99', fakeShowcase),
    row('QN-97', { broken: true }),
    row('AU-1', null),
  ];
  expect(showcaseCards(rows).map((c) => c.card_id)).toEqual(['QN-99']);
  expect(legacyLeads(rows).map((l) => l.code)).toEqual(['AU-1']);
});
