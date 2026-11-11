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

const slug = GUIDE.artisanalEquipment;
// The artisanal licence is for citizens of Kazakhstan: ru and kz only.
const LOCALES = ['ru', 'kz'] as const;

it('registers a dated legal guide in Russian and Kazakh and in llms.txt', () => {
  expect(slug).toBe('artisanal-mining-equipment-kazakhstan');
  expect(findInsight(slug)).toMatchObject({
    category: 'licensing',
    published: '2026-11-12',
    updated: '2026-11-12',
    legal: true,
    lawAsOf: '2026-11-12',
    locales: ['ru', 'kz'],
  });
  expect(
    readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
  ).toContain(`/insights/${slug}`);
});

it.each(['en', 'zh'] as const)(
  'has no %s version and links there to the Russian one',
  (locale) => {
    expect(getArticle(slug, locale)).toBeNull();
    expect(insightHref(locale, slug)).toBe(`/ru/insights/${slug}`);
  }
);

it.each(LOCALES)(
  '%s guide has canonical metadata, official sources and a topical contact',
  async (locale) => {
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    expect(article?.citations).toEqual([
      'https://adilet.zan.kz/rus/docs/K1700000125',
      'https://adilet.zan.kz/rus/docs/V1800016979',
      'https://adilet.zan.kz/rus/docs/V1800016985',
      'https://adilet.zan.kz/rus/docs/K2100000400',
      'https://adilet.zan.kz/rus/docs/K1400000235',
      'https://adilet.zan.kz/rus/docs/K1400000226',
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
    expect(html).toContain(`href="/${locale}/equipment"`);
    for (const key of [
      'artisanalMining',
      'placerGold',
      'licenceCosts',
      'goldLicenceTypes',
    ] as const) {
      expect(html).toContain(`href="/${locale}/insights/${GUIDE[key]}"`);
    }
    expect(html).toContain('<table');
    expect(html).toContain('Article');
    expect(html).toContain('BreadcrumbList');
  }
);

it.each(LOCALES)('%s guide states the limits of article 270', (locale) => {
  const text = getArticle(slug, locale)?.html ?? '';
  for (const limit of ['3 м', '10 т', '0,5 м³', '50 кг']) {
    expect(text).toContain(limit);
  }
  for (const article of ['263', '270', '271', '273', '273-1', '274', '276']) {
    expect(text).toContain(article);
  }
});

it.each(LOCALES)(
  '%s artisanal licence and placer gold guides link to this guide',
  (locale) => {
    for (const key of ['artisanalMining', 'placerGold'] as const) {
      expect(getArticle(GUIDE[key], locale)?.html).toContain(
        `href="/${locale}/insights/${slug}"`
      );
    }
  }
);
