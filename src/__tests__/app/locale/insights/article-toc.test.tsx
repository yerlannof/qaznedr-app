/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage from '@/app/[locale]/insights/[slug]/page';
import { INSIGHTS } from '@/lib/insights/registry';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/ClosingCta', () => () => null);

it('renders heading anchors and an in-flow table of contents for a real article', async () => {
  const html = renderToStaticMarkup(
    await InsightArticlePage({
      params: Promise.resolve({ locale: 'en', slug: INSIGHTS[0].slug }),
    })
  );
  expect(html).toContain('<details');
  expect(html).toContain('href="#section-1"');
  expect(html).toContain('id="section-1" tabindex="-1" class="scroll-mt-24"');
});
