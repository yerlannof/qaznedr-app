/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import {
  OfferGridCard,
  ProspectingGridCard,
  ShowcaseGridCard,
} from '@/components/catalog/GridCards';
import { listPublishedOffers } from '@/lib/offers';
import { getPublicPlot } from '@/lib/prospecting/plots';
import { fakeShowcase } from '../../mocks/showcase-fixture';

jest.mock('@/lib/catalog/verified', () => ({
  verifiedOn: (code: string) => (code === 'QN-P15' ? '2026-10-12' : null),
}));

const p07 = getPublicPlot('QN-P07')!;

describe('ProspectingGridCard', () => {
  it('is «Не верифицировано» until the owner names the code', () => {
    const html = renderToStaticMarkup(
      <ProspectingGridCard plot={p07} locale="ru" />
    );
    expect(html).toContain('Не верифицировано');
    expect(html).not.toContain('Верифицировано QAZNEDR');
    expect(html).toContain('href="/ru/prospecting/QN-P07"');
    expect(html).toContain('Россыпное золото · 4,96 га');
    expect(html).toContain('05.04.2029');
    expect(html).toContain('Доля: по договору');
  });

  it('shows «Верифицировано QAZNEDR» for a verified code', () => {
    const html = renderToStaticMarkup(
      <ProspectingGridCard plot={getPublicPlot('QN-P15')!} locale="ru" />
    );
    expect(html).toContain('Верифицировано QAZNEDR');
  });

  it('marks a plot whose crew is found', () => {
    const html = renderToStaticMarkup(
      <ProspectingGridCard plot={{ ...p07, status: 'matched' }} locale="ru" />
    );
    expect(html).toContain('Бригада найдена');
  });
});

it('OfferGridCard never invents a price', () => {
  const offer = listPublishedOffers()[0];
  const html = renderToStaticMarkup(
    <OfferGridCard offer={offer} locale="ru" />
  );
  expect(html).toContain('Цена: по запросу');
  expect(html).not.toMatch(/[₸$€]|тенге|\bKZT\b/);
  expect(html).toContain(`href="/ru/offers/${offer.code}"`);
});

it('ShowcaseGridCard keeps the number with its type and a caveat', () => {
  const card = {
    ...fakeShowcase,
    headline: { ru: 'Максимум в отдельной пробе: золото до 12 г/т' },
    headline_type: 'spike' as const,
  };
  const html = renderToStaticMarkup(
    <ShowcaseGridCard card={card} locale="ru" />
  );
  expect(html).toContain('Максимум в отдельной пробе:');
  expect(html).toContain('золото до 12 г/т');
  // Type words come before the number in reading order (showcase contract).
  expect(html.indexOf('Максимум в отдельной пробе:')).toBeLessThan(
    html.indexOf('золото до 12 г/т')
  );
  expect(html).toContain(fakeShowcase.facts.ru[0]);
  expect(html).toContain('Проверено');
  expect(html).toContain('Материалы — после NDA');
});

it('keeps a headline without a type colon instead of dropping the number', () => {
  const card = { ...fakeShowcase, headline: { ru: 'Золото 5 г/т' } };
  const html = renderToStaticMarkup(
    <ShowcaseGridCard card={card} locale="ru" />
  );
  expect(html).toContain('Золото 5 г/т');
});

it('shows every caveat of a find that is not featured', () => {
  const html = renderToStaticMarkup(
    <ShowcaseGridCard card={fakeShowcase} locale="ru" />
  );
  for (const fact of fakeShowcase.facts.ru) expect(html).toContain(fact);
});

it('gives the verification hint to screen readers', () => {
  const html = renderToStaticMarkup(
    <ProspectingGridCard plot={p07} locale="ru" />
  );
  expect(html).toContain('Полная проверка объекта и документов');
});
