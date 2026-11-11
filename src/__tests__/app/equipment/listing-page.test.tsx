jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/equipment/catalog/EquipmentDetail', () => () => null);
jest.mock('@/components/equipment/catalog/ViewBeacon', () => () => null);
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('404');
  }),
}));
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  getActiveListing: jest.fn(),
  listingExists: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/image-repository', () => ({
  listImages: jest.fn(async () => []),
}));
jest.mock('@/lib/equipment-listings/moderation-repository', () => ({
  trustMarksFor: jest.fn(async () => ({})),
}));
jest.mock('@/lib/equipment-listings/engagement', () => ({
  ownerOfActiveListing: jest.fn(async () => null),
}));
jest.mock('@/lib/equipment-listings/companies', () => ({
  activeCompanyOf: jest.fn(async () => null),
}));

import { isValidElement, type ReactNode } from 'react';
import Page, { generateMetadata } from '@/app/[locale]/equipment/[id]/page';
import {
  getActiveListing,
  listingExists,
} from '@/lib/equipment-listings/catalog-repository';

const id = '00000000-0000-4000-8000-0000000000a1';
// Made-up listing; no real advertiser data.
const listing = {
  id,
  offerType: 'RENT',
  category: 'excavator',
  title: 'Тестовый экскаватор',
  description: 'Тестовое описание объявления.',
  region: 'almaty',
  city: 'Тестовый город',
  updatedAt: '2026-11-01T00:00:00Z',
};

const props = (locale: string) => ({
  params: Promise.resolve({ locale, id }),
});

/** Every JSON-LD block the page renders. */
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

const env = process.env;
beforeEach(() => {
  process.env = {
    ...env,
    EQUIPMENT_MARKETPLACE_ENABLED: 'true',
    EQUIPMENT_CATALOG_ENABLED: 'true',
  };
  jest.clearAllMocks();
  (getActiveListing as jest.Mock).mockResolvedValue(listing);
});
afterAll(() => {
  process.env = env;
});

describe('one indexable URL per listing', () => {
  it('keeps a self-canonical without hreflang on the original language', async () => {
    const meta = await generateMetadata(props('ru'));
    expect(meta.alternates).toEqual({
      canonical: `https://qaznedr.kz/ru/equipment/${id}`,
    });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it('points the untranslated copies at the original, canonical alone', async () => {
    for (const locale of ['kz', 'en', 'zh']) {
      const meta = await generateMetadata(props(locale));
      expect(meta.alternates).toEqual({
        canonical: `https://qaznedr.kz/ru/equipment/${id}`,
      });
      expect(meta.robots).toEqual({ index: true, follow: true });
    }
  });

  it('follows the language the author wrote in', async () => {
    (getActiveListing as jest.Mock).mockResolvedValue({
      ...listing,
      sourceLanguage: 'en',
    });
    const meta = await generateMetadata(props('ru'));
    expect(meta.alternates?.canonical).toBe(
      `https://qaznedr.kz/en/equipment/${id}`
    );
  });

  it('names the original URL in structured data on every locale', async () => {
    const blocks = jsonLd(await Page(props('zh')));
    const breadcrumb = blocks.find((b) => b['@type'] === 'BreadcrumbList') as {
      itemListElement: { item: string }[];
    };
    expect(breadcrumb.itemListElement[2].item).toBe(
      `https://qaznedr.kz/ru/equipment/${id}`
    );
  });
});

describe('missing and withdrawn listings', () => {
  it('answers 404 for an id that is not a UUID, without reading the database', async () => {
    const bad = { params: Promise.resolve({ locale: 'ru', id: 'not-a-uuid' }) };
    await expect(Page(bad)).rejects.toThrow('404');
    await expect(generateMetadata(bad)).rejects.toThrow('404');
    expect(getActiveListing).not.toHaveBeenCalled();
    expect(listingExists).not.toHaveBeenCalled();
  });

  it('answers 404 for a listing that never existed', async () => {
    (getActiveListing as jest.Mock).mockResolvedValue(null);
    (listingExists as jest.Mock).mockResolvedValue(false);
    await expect(Page(props('ru'))).rejects.toThrow('404');
    await expect(generateMetadata(props('ru'))).rejects.toThrow('404');
  });

  it('keeps the noindex "withdrawn" page for a listing that is no longer active', async () => {
    (getActiveListing as jest.Mock).mockResolvedValue(null);
    (listingExists as jest.Mock).mockResolvedValue(true);
    const page = await Page(props('ru'));
    expect(jsonLd(page)).toEqual([]);
    expect((await generateMetadata(props('ru'))).robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it('does not answer 404 when the database cannot be read', async () => {
    (getActiveListing as jest.Mock).mockRejectedValue(new Error('down'));
    await expect(Page(props('ru'))).resolves.toBeTruthy();
    expect((await generateMetadata(props('ru'))).robots).toEqual({
      index: false,
      follow: false,
    });
  });
});

describe('structured data', () => {
  const types = async (data: Record<string, unknown>) => {
    (getActiveListing as jest.Mock).mockResolvedValue({ ...listing, ...data });
    return jsonLd(await Page(props('ru')));
  };

  it('describes equipment without a price only with breadcrumbs', async () => {
    const blocks = await types({});
    expect(blocks.map((b) => b['@type'])).toEqual(['BreadcrumbList']);
    // A price without its currency is not shown as an amount either.
    expect((await types({ price: 1000 })).map((b) => b['@type'])).toEqual([
      'BreadcrumbList',
    ]);
  });

  it('gives priced equipment a Product with the offer shown on the page', async () => {
    const blocks = await types({
      price: 150000,
      currency: 'KZT',
      priceUnit: 'SHIFT',
    });
    const product = blocks.find((b) => b['@type'] === 'Product')!;
    expect(product.offers).toEqual(
      expect.objectContaining({
        '@type': 'Offer',
        price: 150000,
        priceCurrency: 'KZT',
      })
    );
    const json = JSON.stringify(product);
    for (const absent of ['aggregateRating', 'review', 'availability'])
      expect(json).not.toContain(absent);
    expect(blocks.some((b) => b['@type'] === 'BreadcrumbList')).toBe(true);
  });

  it('describes services as a Service, with an offer only when priced', async () => {
    const unpriced = await types({
      category: 'drillService',
      offerType: 'SERVICE',
    });
    expect(unpriced.map((b) => b['@type'])).toEqual([
      'Service',
      'BreadcrumbList',
    ]);
    expect(unpriced[0]).not.toHaveProperty('offers');
    const priced = await types({
      category: 'drillService',
      offerType: 'SERVICE',
      price: 20000,
      currency: 'KZT',
    });
    expect(priced[0]).toMatchObject({
      '@type': 'Service',
      offers: { price: 20000, priceCurrency: 'KZT' },
    });
  });

  it('gives people and requests neither Product nor Service', async () => {
    for (const data of [
      { category: 'staff', offerType: 'SERVICE', price: 1, currency: 'KZT' },
      { category: 'excavator', offerType: 'WANTED', price: 1, currency: 'KZT' },
    ])
      expect((await types(data)).map((b) => b['@type'])).toEqual([
        'BreadcrumbList',
      ]);
  });
});
