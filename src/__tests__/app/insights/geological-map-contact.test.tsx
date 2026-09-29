/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage from '@/app/[locale]/insights/[slug]/page';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

it.each(['ru', 'kz', 'en', 'zh'])(
  'preserves geology context in the %s map guide contact action',
  async (locale) => {
    const html = renderToStaticMarkup(
      await InsightArticlePage({
        params: Promise.resolve({ locale, slug: GUIDE.geologicalMap }),
      })
    );
    expect(html).toContain(
      `href="/${locale}/contact?service=geology&amp;guide=${GUIDE.geologicalMap}"`
    );
  }
);

it('keeps the guide slug on other contact actions', async () => {
  const html = renderToStaticMarkup(
    await InsightArticlePage({
      params: Promise.resolve({
        locale: 'en',
        slug: GUIDE.reserveClassification,
      }),
    })
  );
  expect(html).toContain(
    `href="/en/contact?guide=${GUIDE.reserveClassification}"`
  );
  expect(html).not.toContain('href="/en/contact?service=geology"');
});
