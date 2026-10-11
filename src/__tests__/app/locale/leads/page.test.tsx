/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LeadsCatalogPage from '@/app/[locale]/leads/page';
import { listPublicPlots } from '@/lib/prospecting/plots';
import { getServerTranslation } from '@/lib/i18n/translations';
import { listPublishedLeads } from '@/lib/leads/public-queries';

jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn(),
}));
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/catalog/CatalogFilters', () => ({
  __esModule: true,
  default: () => null,
  SortSelect: () => null,
}));
jest.mock('@/components/cards/LeadCard', () => ({
  __esModule: true,
  default: ({ lead }: { lead: { code: string } }) => (
    <article>{lead.code}</article>
  ),
}));

const render = async (
  locale: string,
  searchParams: Record<string, string> = {}
) =>
  renderToStaticMarkup(
    await LeadsCatalogPage({
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve(searchParams),
    })
  );

const schemaOf = (html: string) => {
  const m = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
  expect(m).not.toBeNull();
  return JSON.parse(m![1]);
};

beforeEach(() =>
  (listPublishedLeads as jest.Mock).mockResolvedValue({
    leads: [],
    total: 0,
    page: 1,
    totalPages: 0,
  })
);

it('lists the asset for sale with a localized CollectionPage schema', async () => {
  const html = await render('en');
  const { t } = getServerTranslation('en');
  expect(html).toContain('QN-A01');
  expect(html).toContain('/en/offers/QN-A01');
  expect(html).toContain('/en/minerals/copper');
  expect(html).not.toContain('<main');
  expect(schemaOf(html)).toMatchObject({
    '@type': 'CollectionPage',
    name: t('catalog.title'),
    url: 'https://qaznedr.kz/en/leads',
    inLanguage: 'en',
    mainEntity: { '@type': 'ItemList' },
  });
  const list = schemaOf(html).mainEntity.itemListElement;
  expect(list.map((e: { url: string }) => e.url)).toContain(
    'https://qaznedr.kz/en/offers/QN-A01'
  );
  expect(list).toHaveLength(1 + listPublicPlots().length);
});

it('lists artisanal-mining plots as their own kind', async () => {
  const html = await render('ru', { kind: 'prospecting' });
  const urls = schemaOf(html).mainEntity.itemListElement.map(
    (e: { url: string }) => e.url
  );
  expect(urls).toHaveLength(listPublicPlots().length);
  expect(urls).toContain('https://qaznedr.kz/ru/prospecting/QN-P07');
  expect(html).toContain('href="/ru/prospecting/QN-P07"');
  expect(html).not.toContain('QN-A01');
});

it('never renders unrelated legacy rows next to filtered results', async () => {
  (listPublishedLeads as jest.Mock).mockResolvedValue({
    leads: [{ code: 'CU-42' }],
    total: 1,
    page: 1,
    totalPages: 1,
  });
  expect(await render('ru')).toContain('CU-42');
  expect(await render('ru', { kind: 'asset' })).not.toContain('CU-42');
});

it('shows an honest empty state and an empty ItemList when filters match nothing', async () => {
  const html = await render('ru', { kind: 'find' });
  expect(html).toContain('Сбросить фильтры');
  expect(html).toContain('/ru/contact');
  expect(html).not.toContain('сообщим, когда');
  expect(schemaOf(html).mainEntity.itemListElement).toEqual([]);
});

it('keeps old metal-hub links working and offers to remove the filter', async () => {
  const html = await render('ru', { mineral: 'copper' });
  expect(html).not.toContain('QN-A01');
  expect(html).toContain('Убрать фильтр: Медь');
});

it('shows cards by default and the long list on ?view=list', async () => {
  const grid = await render('ru', { kind: 'prospecting' });
  expect(grid).toContain('Не верифицировано');
  expect(grid).toMatch(
    /aria-current="true"[^>]*aria-label="Карточки"|aria-label="Карточки"[^>]*aria-current="true"/
  );
  expect(grid).toContain('href="/ru/leads?kind=prospecting&amp;view=list"');
  const list = await render('ru', { kind: 'prospecting', view: 'list' });
  expect(list).not.toContain('Не верифицировано');
  expect(list).toContain('Работа на участке по договору с держателем лицензии');
});
