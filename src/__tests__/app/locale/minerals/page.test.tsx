/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import Page, { generateMetadata } from '@/app/[locale]/minerals/[mineral]/page';
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { getServerTranslation } from '@/lib/i18n/translations';
import { hubMineralName, MINERAL_HUBS } from '@/lib/leads/minerals';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { GUIDE, insightHref } from '@/lib/insights/registry';
import type { LeadTeaser } from '@/lib/leads/types';
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

const emptyResult = { leads: [], total: 0, totalPages: 0, page: 1, limit: 24 };
const publishedGoldLead: LeadTeaser = {
  code: 'AU-17',
  mineral: 'Au',
  type: 'bedrock',
  region: null,
  tier: 'TIER2_BOMB',
  exclusivity: 'MASS',
  teaser_title: null,
  teaser_summary: null,
  grade_display: null,
  grade_label: null,
  byproducts_display: null,
  reserve_categories: null,
  license_status: null,
  last_verified: null,
  distance_band: null,
  map_centroid: null,
  fair_value_min_usd_m: null,
  fair_value_max_usd_m: null,
  jorc_potential_usd_m: null,
  price_display: null,
  confidence: null,
  status: 'PUBLISHED',
  sold_count: 0,
};
const goldGuideKeys = [
  'geologicalMap',
  'eastKazakhstanGoldMap',
  'satelliteGoldMap',
] as const;

beforeEach(() => {
  (listPublishedLeads as jest.Mock).mockResolvedValue(emptyResult);
});

it.each(
  (['ru', 'kz', 'en', 'zh'] as const).flatMap((locale) =>
    (['empty', 'populated'] as const).map((state) => [locale, state] as const)
  )
)(
  'shows the approved guide links once and in order on %s gold with %s leads',
  async (locale, state) => {
    if (state === 'populated') {
      (listPublishedLeads as jest.Mock).mockResolvedValue({
        ...emptyResult,
        leads: [publishedGoldLead],
        total: 1,
      });
    }
    const html = renderToStaticMarkup(
      await Page({ params: Promise.resolve({ locale, mineral: 'gold' }) })
    );
    const { t } = getServerTranslation(locale);
    const expected = [...goldGuideKeys, 'reserveClassification'] as const;
    const positions = expected.map((key) => {
      const href = insightHref(locale, GUIDE[key]);
      const link = `href="${href}"`;
      expect(html.split(link)).toHaveLength(2);
      expect(html).toContain(t(`insights.links.${key}`));
      return html.indexOf(link);
    });
    const faq = `href="/${locale}/faq"`;
    expect(html.split(faq)).toHaveLength(2);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions[positions.length - 1]).toBeLessThan(html.indexOf(faq));
    expect(html).toContain(t('footerNav.info.faq'));
  }
);

it.each(
  (['ru', 'kz', 'en', 'zh'] as const).flatMap((locale) =>
    MINERAL_HUBS.filter(({ slug }) => slug !== 'gold').map(
      ({ slug }) => [locale, slug] as const
    )
  )
)('keeps existing links only on %s %s hub', async (locale, mineral) => {
  const html = renderToStaticMarkup(
    await Page({ params: Promise.resolve({ locale, mineral }) })
  );
  for (const key of goldGuideKeys) {
    expect(html).not.toContain(`href="${insightHref(locale, GUIDE[key])}"`);
  }
  expect(
    html.split(`href="${insightHref(locale, GUIDE.reserveClassification)}"`)
  ).toHaveLength(2);
  expect(html.split(`href="/${locale}/faq"`)).toHaveLength(2);
});
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
