jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/home/PageHero', () => () => null);
jest.mock('@/components/equipment/catalog/EquipmentCatalog', () => () => null);
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('404');
  }),
}));
jest.mock('@/lib/email/resend', () => ({
  emailDeliveryConfigured: () => false,
}));
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  searchEquipmentCatalog: jest.fn(),
  catalogFacets: jest.fn(async () => []),
  coverImagesFor: jest.fn(async () => ({})),
}));
jest.mock('@/lib/equipment-listings/moderation-repository', () => ({
  trustMarksFor: jest.fn(async () => ({})),
}));

import { isValidElement, type ReactNode } from 'react';
import Page, { generateMetadata } from '@/app/[locale]/equipment/page';
import { searchEquipmentCatalog } from '@/lib/equipment-listings/catalog-repository';

// Made-up listings; no real advertiser data.
const items = [
  { id: '00000000-0000-4000-8000-0000000000b1', title: 'Тест один' },
  {
    id: '00000000-0000-4000-8000-0000000000b2',
    title: 'Test two',
    sourceLanguage: 'en',
  },
];

function jsonLd(node: ReactNode): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(jsonLd);
  if (!isValidElement(node)) return [];
  const p = node.props as {
    type?: string;
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
  };
  if (node.type === 'script' && p.type === 'application/ld+json')
    return [JSON.parse(p.dangerouslySetInnerHTML!.__html)];
  return jsonLd(p.children);
}

const props = (search: Record<string, string> = {}, locale = 'en') => ({
  params: Promise.resolve({ locale }),
  searchParams: Promise.resolve(search),
});

const env = process.env;
beforeEach(() => {
  process.env = {
    ...env,
    EQUIPMENT_MARKETPLACE_ENABLED: 'true',
    EQUIPMENT_CATALOG_ENABLED: 'true',
  };
  jest.clearAllMocks();
  (searchEquipmentCatalog as jest.Mock).mockResolvedValue({
    items,
    total: 2,
    page: 1,
    limit: 24,
  });
});
afterAll(() => {
  process.env = env;
});

describe('catalogue structured data', () => {
  it('lists the listings on the page as a CollectionPage with breadcrumbs', async () => {
    const blocks = jsonLd(await Page(props()));
    const collection = blocks.find((b) => b['@type'] === 'CollectionPage') as {
      url: string;
      inLanguage: string;
      mainEntity: { '@type': string; itemListElement: unknown[] };
    };
    expect(collection.url).toBe('https://qaznedr.kz/en/equipment');
    expect(collection.inLanguage).toBe('en');
    expect(collection.mainEntity['@type']).toBe('ItemList');
    // Each item links the listing's one indexable URL.
    expect(collection.mainEntity.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Тест один',
        url: `https://qaznedr.kz/ru/equipment/${items[0].id}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Test two',
        url: `https://qaznedr.kz/en/equipment/${items[1].id}`,
      },
    ]);
    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList') as {
      itemListElement: { item: string }[];
    };
    expect(breadcrumb.itemListElement.map((i) => i.item)).toEqual([
      'https://qaznedr.kz/en',
      'https://qaznedr.kz/en/equipment',
    ]);
  });

  it('numbers items on later pages from where the page starts', async () => {
    const blocks = jsonLd(
      await Page(props({ page: '2', region: 'almaty-region' }))
    );
    const collection = blocks.find((b) => b['@type'] === 'CollectionPage') as {
      url: string;
      mainEntity: { itemListElement: { position: number }[] };
    };
    expect(collection.url).toBe(
      'https://qaznedr.kz/en/equipment?region=almaty-region&page=2'
    );
    expect(
      collection.mainEntity.itemListElement.map((i) => i.position)
    ).toEqual([25, 26]);
  });

  it('keeps breadcrumbs but claims no list when the catalogue cannot be read', async () => {
    (searchEquipmentCatalog as jest.Mock).mockRejectedValue(new Error('down'));
    const types = jsonLd(await Page(props())).map((b) => b['@type']);
    expect(types).toEqual(['BreadcrumbList']);
    (searchEquipmentCatalog as jest.Mock).mockResolvedValue({
      items: [],
      total: 2,
      page: 9,
      limit: 24,
    });
    expect(
      jsonLd(await Page(props({ page: '9' }))).map((b) => b['@type'])
    ).toEqual(['BreadcrumbList']);
  });
});

describe('catalogue metadata', () => {
  it('stays indexable in every language with hreflang', async () => {
    const meta = await generateMetadata(props({}, 'zh'));
    expect(meta.alternates?.canonical).toBe('https://qaznedr.kz/zh/equipment');
    expect(Object.keys(meta.alternates?.languages ?? {})).toHaveLength(5);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});

describe('catalogue pagination', () => {
  it('lets crawlers follow later pages without pointing them at page one', async () => {
    for (const search of [{ page: '2' }, { page: '3', category: 'drill' }]) {
      const meta = await generateMetadata(props(search, 'ru'));
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBeUndefined();
      expect(meta.alternates?.languages).toBeUndefined();
    }
  });

  it('leaves filtered first pages as they were', async () => {
    const meta = await generateMetadata(props({ offerType: 'RENT' }, 'ru'));
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBe('https://qaznedr.kz/ru/equipment');
  });
});
