/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import Page, { generateMetadata } from '@/app/[locale]/minerals/[mineral]/page';
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { getServerTranslation } from '@/lib/i18n/translations';
import { hubMineralName, MINERAL_HUBS } from '@/lib/leads/minerals';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import type { Locale } from '@/lib/seo/site';
jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn().mockResolvedValue({
    leads: [],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 24,
  }),
}));
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
it.each(['gold', 'copper', 'lead-zinc', 'molybdenum', 'tungsten', 'iron'])(
  'publishes a localized indexable %s hub',
  async (mineral) => {
    const params = Promise.resolve({ locale: 'zh', mineral });
    const html = renderToStaticMarkup(await Page({ params }));
    expect(listPublishedLeads).toHaveBeenCalledWith(
      expect.objectContaining({ mineral })
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('CollectionPage');
    expect(html).toContain('BreadcrumbList');
    expect(html).toContain('/zh/leads?mineral=' + mineral);
    expect(PUBLIC_PAGES).toContain('/minerals/' + mineral);
    const meta = await generateMetadata({ params });
    expect(meta.alternates?.canonical).toBe(
      'https://qaznedr.kz/zh/minerals/' + mineral
    );
    expect(meta.robots).toMatchObject({ index: true });
  }
);
it.each(
  (['ru', 'kz', 'en', 'zh'] as const).flatMap((locale) =>
    MINERAL_HUBS.map(({ slug }) => [locale, slug] as const)
  )
)(
  'uses a distinct approved %s description for %s in metadata and schema',
  async (locale, mineral) => {
    const params = Promise.resolve({ locale, mineral });
    const expected = `${hubMineralName(mineral, locale)}: ${getServerTranslation(locale).t('leadsCatalog.valueProp2')}`;
    const meta = await generateMetadata({ params });
    expect(meta.description).toBe(expected);
    const html = renderToStaticMarkup(await Page({ params }));
    const schemas = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([^<]+)<\/script>/g
      ),
    ].map((match) => JSON.parse(match[1]));
    const collection = schemas.find(
      (schema) => schema['@type'] === 'CollectionPage'
    );
    expect(collection.description).toBe(expected);
  }
);
it.each(['ru', 'kz', 'en', 'zh'] as Locale[])(
  'keeps all six %s hub metadata descriptions unique',
  async (locale) => {
    const descriptions = await Promise.all(
      MINERAL_HUBS.map(
        async ({ slug }) =>
          (
            await generateMetadata({
              params: Promise.resolve({ locale, mineral: slug }),
            })
          ).description
      )
    );
    expect(new Set(descriptions).size).toBe(MINERAL_HUBS.length);
  }
);
it('rejects an unknown hub', async () => {
  const params = Promise.resolve({ locale: 'en', mineral: 'imaginary' });
  await expect(Page({ params })).rejects.toThrow('NEXT_NOT_FOUND');
  await expect(generateMetadata({ params })).rejects.toThrow('NEXT_NOT_FOUND');
});
