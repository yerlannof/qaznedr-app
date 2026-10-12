/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LeadsCatalogPage from '@/app/[locale]/leads/page';
import { listPublicPlots } from '@/lib/prospecting/plots';
import { listPublishedOffers } from '@/lib/offers';
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
  expect(list.map((e: { url: string }) => e.url)).toContain(
    'https://qaznedr.kz/en/offers/QN-A02'
  );
  expect(list).toHaveLength(
    listPublishedOffers().length + listPublicPlots().length
  );
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

const legacyRows = [{ code: 'CU-42' }, { code: 'AU-43' }];
const locales = ['ru', 'kz', 'en', 'zh'];
const views = ['grid', 'list'];

describe.each(locales.flatMap((locale) => views.map((view) => [locale, view])))(
  'legacy catalogue rows in %s, %s view',
  (locale, view) => {
    beforeEach(() => {
      (listPublishedLeads as jest.Mock).mockResolvedValue({
        leads: legacyRows,
        total: legacyRows.length,
        page: 1,
        totalPages: 1,
      });
    });

    it.each([{}, { kind: 'find' }, { sort: 'area_desc' }])(
      'includes visible rows in the count and JSON-LD for %j',
      async (facets) => {
        const html = await render(locale, { ...facets, view });
        const list = schemaOf(html).mainEntity.itemListElement;
        const unifiedCount =
          'kind' in facets
            ? 0
            : listPublishedOffers().length + listPublicPlots().length;
        const { t } = getServerTranslation(locale as 'ru' | 'kz' | 'en' | 'zh');
        const count = unifiedCount + legacyRows.length;
        const shown = t('catalog.shown', { count });
        expect(html).toContain(`aria-label="${shown}"`);
        expect(html).toContain(`<span>${shown}</span>`);
        expect(html).toContain('>CU-42</article>');
        expect(html).toContain('>AU-43</article>');
        expect(list.map((item: { position: number }) => item.position)).toEqual(
          Array.from({ length: count }, (_, index) => index + 1)
        );
        expect(list.slice(-2).map((item: { url: string }) => item.url)).toEqual(
          [
            `https://qaznedr.kz/${locale}/leads/CU-42`,
            `https://qaznedr.kz/${locale}/leads/AU-43`,
          ]
        );
      }
    );

    it.each([{}, { kind: 'asset' }])(
      'keeps the find tab and legacy count for %j',
      async (facets) => {
        const html = await render(locale, { ...facets, view });
        const href = `/${locale}/leads?kind=find${view === 'list' ? '&amp;view=list' : ''}`;
        const tab = [
          ...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g),
        ].find((match) => match[1] === href);
        expect(tab).toBeDefined();
        expect(tab![2]).toContain(
          `<span class="text-sm opacity-70">${legacyRows.length}</span>`
        );
      }
    );

    it.each([
      { commodity: 'Au' },
      { region: 'zhetysu' },
      { stage: 'occurrence' },
      { infra: '1' },
      { group: 'metals_tpi' },
    ])('excludes legacy rows with find and facet %j', async (facet) => {
      const html = await render(locale, { kind: 'find', ...facet, view });
      expect(html).not.toContain('>CU-42</article>');
      expect(html).not.toContain('>AU-43</article>');
      const list = schemaOf(html).mainEntity.itemListElement;
      expect(list).toEqual([]);
      const { t } = getServerTranslation(locale as 'ru' | 'kz' | 'en' | 'zh');
      const shown = t('catalog.shown', { count: 0 });
      expect(html).toContain(`aria-label="${shown}"`);
      expect(html).toContain(`<span>${shown}</span>`);
    });

    it('excludes legacy rows when a facet is selected without a kind', async () => {
      const html = await render(locale, { commodity: 'Au', view });
      expect(html).not.toContain('>CU-42</article>');
      expect(html).not.toContain('>AU-43</article>');
      const list = schemaOf(html).mainEntity.itemListElement;
      expect(list).toHaveLength(listPublicPlots().length + 1);
      expect(
        list.every((item: { url: string }) => !item.url.endsWith('CU-42'))
      ).toBe(true);
      const { t } = getServerTranslation(locale as 'ru' | 'kz' | 'en' | 'zh');
      const shown = t('catalog.shown', { count: list.length });
      expect(html).toContain(`aria-label="${shown}"`);
      expect(html).toContain(`<span>${shown}</span>`);
    });
  }
);

it('does not count or expose an invalid showcase as a legacy row', async () => {
  (listPublishedLeads as jest.Mock).mockResolvedValue({
    leads: [...legacyRows, { code: 'QN-99', showcase: {} }],
    total: 3,
    page: 1,
    totalPages: 1,
  });
  const html = await render('ru');
  const list = schemaOf(html).mainEntity.itemListElement;
  expect(html).not.toContain('>QN-99</article>');
  expect(html).not.toContain('/ru/leads/QN-99');
  expect(list).toHaveLength(
    listPublishedOffers().length + listPublicPlots().length + legacyRows.length
  );
  expect(html).toContain(
    `aria-label="${getServerTranslation('ru').t('catalog.shown', { count: list.length })}"`
  );
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
