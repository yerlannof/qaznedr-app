/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LeadsCatalogPage from '@/app/[locale]/leads/page';
import {
  listPublishedLeads,
  listLeadRegions,
} from '@/lib/leads/public-queries';

jest.mock('@/lib/leads/public-queries', () => ({
  listPublishedLeads: jest.fn(),
  listLeadRegions: jest.fn(),
}));
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/cards/LeadCard', () => ({
  __esModule: true,
  default: ({ lead }: { lead: { code: string } }) => (
    <article>{lead.code}</article>
  ),
}));

beforeEach(() =>
  (listLeadRegions as jest.Mock).mockResolvedValue(['Карагандинская'])
);

it('uses real filters and retains them in pagination links', async () => {
  (listPublishedLeads as jest.Mock).mockResolvedValue({
    leads: [{ code: 'CU-42' }],
    total: 30,
    page: 2,
    totalPages: 3,
  });
  const html = renderToStaticMarkup(
    await LeadsCatalogPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({
        mineral: 'copper',
        region: 'Карагандинская',
        type: 'bedrock',
        tier: 'TIER2_BOMB',
        free: '1',
        sort: 'newest',
        page: '2',
      }),
    })
  );
  expect(listPublishedLeads).toHaveBeenCalledWith(
    expect.objectContaining({
      mineral: 'copper',
      type: 'bedrock',
      tier: 'TIER2_BOMB',
      freeOnly: true,
      page: 2,
    })
  );
  expect(html).toContain('mineral=copper');
  expect(html).toContain('type=bedrock');
  expect(html).toContain('tier=TIER2_BOMB');
  expect(html).toContain('page=3');
  expect(html).toContain('CU-42');
  expect(html).not.toContain('<main');
  expect(html).toContain('/en/minerals/copper');
});

it('shows honest empty state without an unimplemented notification promise', async () => {
  (listPublishedLeads as jest.Mock).mockResolvedValue({
    leads: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });
  const html = renderToStaticMarkup(
    await LeadsCatalogPage({
      params: Promise.resolve({ locale: 'ru' }),
      searchParams: Promise.resolve({}),
    })
  );
  expect(html).toContain('Сбросить фильтры');
  expect(html).toContain('/ru/contact');
  expect(html).not.toContain('сообщим, когда');
});
