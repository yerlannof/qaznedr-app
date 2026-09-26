/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import Page, { generateMetadata } from '@/app/[locale]/minerals/[mineral]/page';
import { listPublishedLeads } from '@/lib/leads/public-queries';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
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
it('rejects an unknown hub', async () => {
  const params = Promise.resolve({ locale: 'en', mineral: 'imaginary' });
  await expect(Page({ params })).rejects.toThrow('NEXT_NOT_FOUND');
  await expect(generateMetadata({ params })).rejects.toThrow('NEXT_NOT_FOUND');
});
