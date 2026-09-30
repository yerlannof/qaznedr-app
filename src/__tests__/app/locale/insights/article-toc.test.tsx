/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage from '@/app/[locale]/insights/[slug]/page';
import { INSIGHTS } from '@/lib/insights/registry';
import { listArticles } from '@/lib/insights/content';
import { orderRelatedArticles } from '@/lib/insights/related';
import { LOCALES } from '@/lib/seo/site';

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

it.each(LOCALES)(
  'renders all %s related guide links in the editorial order',
  async (locale) => {
    const slug = INSIGHTS[0].slug;
    const html = renderToStaticMarkup(
      await InsightArticlePage({ params: Promise.resolve({ locale, slug }) })
    );
    const section = html.slice(
      html.indexOf('<ul class="mt-6 divide-y divide-brand-line')
    );
    const expected = orderRelatedArticles(slug, listArticles(locale));
    const links = [
      ...section.matchAll(/href="(\/(?:ru|kz|en|zh)\/insights\/[^\"]+)"/g),
    ].map((match) => match[1]);
    expect(links.slice(0, expected.length)).toEqual(
      expected.map((card) => `/${card.locale}/insights/${card.slug}`)
    );
    const visible = section
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    for (const card of expected) expect(visible).toContain(card.title);
  }
);
