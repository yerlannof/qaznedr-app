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

const slug = GUIDE.goldMap;
const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;

it('registers a dated geology guide with a legal note in four languages and in llms.txt', () => {
  expect(slug).toBe('gold-map-kazakhstan');
  expect(findInsight(slug)).toMatchObject({
    category: 'geology',
    published: '2026-11-12',
    updated: '2026-11-12',
    legal: true,
    lawAsOf: '2026-11-12',
    locales: ['ru', 'en', 'zh', 'kz'],
  });
  expect(
    readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
  ).toContain(`/insights/${slug}`);
});

it.each(LOCALES)(
  '%s guide has canonical metadata, cited sources and a topical contact',
  async (locale) => {
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    expect(article?.citations).toEqual([
      'https://adilet.zan.kz/rus/docs/K1700000125',
      'https://www.gov.kz/uploads/2025/10/30/2053d65881dcc268afe39e8649dbf53e_original.2184225.pdf',
      'https://pubs.usgs.gov/myb/vol3/2023/myb3-2023-kazakhstan.pdf',
      'https://pubs.usgs.gov/myb/vol3/2022/myb3-2022-kazakhstan.pdf',
      'https://earchive.tpu.ru/handle/11683/12267',
      'https://doi.org/10.18799/24131830/2020/4/2603',
      'https://forbes.kz/articles/zapasy-zolota-vkazahstane-dostigli-23-tysyach-tonn-nefti-43mlrd-tonn-5fc32e',
      'https://www.gov.kz/memleket/entities/zhetysu-natural/press/article/details/166247?lang=ru',
      'https://www.gov.kz/memleket/entities/mps/press/news/details/1140710?lang=ru',
      'https://www.gov.kz/memleket/entities/geology/press/news/details/1143562?lang=ru',
      'https://minerals-map.e-qazyna.kz/ru/start',
      'https://minerals.e-qazyna.kz/ru/guest/reestr/geological-reports',
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
    expect(html).toContain(`href="/${locale}/minerals/gold"`);
    for (const key of [
      'geologicalMap',
      'readGeologicalMap',
      'pugfn',
      'eastKazakhstanGoldMap',
      'satelliteGoldMap',
      'artisanalMining',
      'placerGold',
      'goldLicenceTypes',
      'reserveClassification',
    ] as const) {
      expect(html).toContain(`href="/${locale}/insights/${GUIDE[key]}"`);
    }
    expect(html).toContain('<table');
    expect(html).toContain('Article');
    expect(html).toContain('BreadcrumbList');
  }
);

it.each(LOCALES)('%s gold map guides link to the new guide', (locale) => {
  for (const key of [
    'satelliteGoldMap',
    'eastKazakhstanGoldMap',
    'placerGold',
  ] as const) {
    expect(getArticle(GUIDE[key], locale)?.html).toContain(
      `href="/${locale}/insights/${slug}"`
    );
  }
});
