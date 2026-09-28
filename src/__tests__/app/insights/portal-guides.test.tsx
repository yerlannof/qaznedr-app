/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage, {
  generateMetadata,
} from '@/app/[locale]/insights/[slug]/page';
import LegalServicesPage from '@/app/[locale]/services/legal/page';
import { findInsight } from '@/lib/insights/registry';
import { getArticle } from '@/lib/insights/content';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

const slugs = [
  'artisanal-mining-licence-kazakhstan',
  'pugfn-subsoil-fund-program-kazakhstan',
];
it.each(slugs)(
  '%s has an explicit legal review date and four published languages',
  (slug) => {
    expect(findInsight(slug)).toMatchObject({
      legal: true,
      lawAsOf: '2026-09-29',
    });
    expect(findInsight(slug)?.locales.slice().sort()).toEqual([
      'en',
      'kz',
      'ru',
      'zh',
    ]);
  }
);
it.each(['ru', 'kz', 'en', 'zh'] as const)(
  '%s guides have matching visible content, metadata, schema and contextual links',
  async (locale) => {
    const legal = renderToStaticMarkup(
      await LegalServicesPage({ params: Promise.resolve({ locale }) })
    );
    for (const slug of slugs) {
      const article = getArticle(slug, locale);
      expect(article).not.toBeNull();
      if (!article) continue;
      const params = Promise.resolve({ locale, slug });
      const meta = await generateMetadata({ params });
      expect(meta.alternates?.canonical).toBe(
        `https://qaznedr.kz/${locale}/insights/${slug}`
      );
      expect(Object.keys(meta.alternates?.languages ?? {})).toEqual([
        'ru',
        'en',
        'zh-CN',
        'kk',
        'x-default',
      ]);
      expect(meta.description).toBe(article.description);
      const html = renderToStaticMarkup(await InsightArticlePage({ params }));
      expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
      expect(html).toContain(`href="/${locale}/contact?service=geology"`);
      const scripts = [
        ...html.matchAll(
          /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g
        ),
      ].map((m) => JSON.parse(m[1]));
      expect(scripts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            '@type': 'Article',
            headline: article.title,
            dateModified: '2026-09-29',
          }),
        ])
      );
      expect(legal).toContain(`href="/${locale}/insights/${slug}"`);
    }
  }
);
