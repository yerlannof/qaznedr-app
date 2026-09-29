/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage, {
  generateMetadata,
} from '@/app/[locale]/insights/[slug]/page';
import { getArticle } from '@/lib/insights/content';
import { findInsight, insightHref } from '@/lib/insights/registry';
import { guideTitle, guideFromPath } from '@/lib/insights/contact-context';
import { readFileSync } from 'node:fs';
import path from 'node:path';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

const slug = 'satellite-gold-map-guide';
it('registers a dated educational article without changing legal-guide dates', () => {
  expect(findInsight(slug)).toMatchObject({
    category: 'geology',
    published: '2026-09-30',
    updated: '2026-09-30',
    legal: false,
    locales: ['ru', 'en', 'zh', 'kz'],
  });
  expect(
    readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
  ).toContain(`/insights/${slug}`);
});

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  '%s guide preserves discoverability, source evidence and the contact topic',
  async (locale) => {
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
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
    expect(html).toContain(`href="/${locale}/contact?guide=${slug}"`);
    expect(html).toContain(
      'https://www.usgs.gov/science/remote-sensing-minerals'
    );
    expect(html).toContain(
      'https://www.esa.int/Applications/Observing_the_Earth/Sentinels_helping_to_map_minerals'
    );
    expect(html).toContain(
      'https://www.usgs.gov/data/digital-maps-hydrothermal-alteration-type-key-mineral-groups-and-green-vegetation-western'
    );
    expect(html).toContain('<table');
    expect(html).toContain('Article');
    expect(html).toContain('BreadcrumbList');
  }
);
