import { getPublicPlot } from '@/lib/prospecting/plots';
import {
  formatArea,
  formatDate,
  mapLinks,
  placeLine,
  plotJsonLd,
  plotSeoText,
  whatsappText,
} from '@/lib/prospecting/present';

const p07 = getPublicPlot('QN-P07')!;
const p15 = getPublicPlot('QN-P15')!;

it('formats area and dates the way licences print them', () => {
  expect(formatArea(4.96, 'ru')).toBe('4,96');
  expect(formatArea(4.7482, 'en')).toBe('4.7482');
  expect(formatDate('2029-04-05')).toBe('05.04.2029');
});

it('describes the place by district, region and village or plot name', () => {
  expect(placeLine(p07, 'ru')).toBe(
    'Алакольский район, область Жетісу · с. Коктума'
  );
  expect(placeLine(p15, 'en')).toBe(
    'Markakol District, East Kazakhstan Region · Basterekty No. 2 plot'
  );
});

it('builds SEO text with code, area, district and licence term', () => {
  const { title, description } = plotSeoText(p07, 'ru');
  expect(title).toBe(
    'Старательский участок QN-P07: россыпное золото, 4,96 га, Алакольский район'
  );
  expect(description).toContain('до 05.04.2029');
  expect(description).toContain('по договору с держателем');
});

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  'distinguishes the descriptions of adjacent plots with the same licence term in %s',
  (locale) => {
    const first = plotSeoText(p07, locale);
    const adjacent = plotSeoText({ ...p07, code: 'QN-P99' }, locale);
    expect(first.description).toContain(p07.code);
    expect(adjacent.description).toContain('QN-P99');
    expect(first.description).not.toBe(adjacent.description);
    expect(first.description).toContain(formatDate(p07.valid_until));
  }
);

it('pre-fills the WhatsApp message with the plot code', () => {
  expect(whatsappText(p07, 'ru')).toContain('QN-P07 (Алакольский район)');
});

it('links both map services to the plot centre', () => {
  const { google, twoGis } = mapLinks({ lat: 45.6846, lon: 81.987013 });
  expect(google).toBe(
    'https://www.google.com/maps/search/?api=1&query=45.684600,81.987013'
  );
  expect(twoGis).toBe('https://2gis.kz/?m=81.987013,45.684600/16');
});

describe('plotJsonLd', () => {
  const { place, breadcrumb } = plotJsonLd(p07, 'ru');

  it('is a Place with a closed polygon, never an offer', () => {
    expect(place['@type']).toBe('Place');
    const coords = place.geo.polygon.split(' ');
    expect(coords).toHaveLength(10);
    expect(coords.slice(0, 2)).toEqual(coords.slice(-2));
    expect(JSON.stringify(place)).not.toMatch(/Offer|Product|JobPosting/);
  });

  it('uses the canonical qaznedr.kz URL', () => {
    expect(place.url).toBe('https://qaznedr.kz/ru/prospecting/QN-P07');
    expect(breadcrumb.itemListElement[1].item).toBe(
      'https://qaznedr.kz/ru/prospecting'
    );
  });
});
