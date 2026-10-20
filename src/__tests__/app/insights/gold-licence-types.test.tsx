/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage, {
  generateMetadata,
} from '@/app/[locale]/insights/[slug]/page';
import { getArticle } from '@/lib/insights/content';
import { GUIDE, findInsight, insightHref } from '@/lib/insights/registry';
import { guideTitle, guideFromPath } from '@/lib/insights/contact-context';
import { readFileSync } from 'node:fs';
import path from 'node:path';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

const slug = GUIDE.goldLicenceTypes;
const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;

it('registers a dated legal guide in four languages and in llms.txt', () => {
  expect(slug).toBe('gold-licence-types-kazakhstan');
  expect(findInsight(slug)).toMatchObject({
    category: 'licensing',
    published: '2026-10-20',
    updated: '2026-10-20',
    legal: true,
    lawAsOf: '2026-10-20',
    locales: ['ru', 'en', 'zh', 'kz'],
  });
  expect(
    readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
  ).toContain(`/insights/${slug}`);
});

it.each(LOCALES)(
  '%s guide has canonical metadata, official sources and a topical contact',
  async (locale) => {
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    expect(article?.citations).toEqual([
      'https://adilet.zan.kz/rus/docs/K1700000125',
      'https://minerals.e-qazyna.kz/ru/minerals/gosuslugi',
      expect.stringContaining(
        'https://minerals.e-qazyna.kz/ru/minerals/gosuslugi/'
      ),
    ]);
    const params = Promise.resolve({ locale, slug });
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(
      `https://qaznedr.kz/${locale}/insights/${slug}`
    );
    expect(metadata.description).toBe(article?.description);
    expect(insightHref(locale, slug)).toBe(`/${locale}/insights/${slug}`);
    expect(guideTitle(locale, slug)).toBeTruthy();
    expect(guideFromPath(`/${locale}/insights/${slug}`)).toBe(slug);
    const html = renderToStaticMarkup(await InsightArticlePage({ params }));
    expect(html.match(/<h1\b/g) ?? []).toHaveLength(1);
    expect(html).toContain(
      `href="/${locale}/contact?service=geology&amp;guide=${slug}"`
    );
    expect(html).toContain(`href="/${locale}/leads"`);
    expect(html).toContain('<table');
    expect(html).toContain('Article');
    expect(html).toContain('BreadcrumbList');
  }
);

it.each(LOCALES)(
  '%s related licence guides link to the comparison',
  (locale) => {
    for (const key of [
      'artisanalMining',
      'explorationLicence',
      'rightsTransfer',
    ] as const) {
      expect(getArticle(GUIDE[key], locale)?.html).toContain(
        `href="/${locale}/insights/${slug}"`
      );
    }
  }
);
