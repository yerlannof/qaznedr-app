/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage, {
  generateMetadata,
} from '@/app/[locale]/insights/[slug]/page';
import { getArticle } from '@/lib/insights/content';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  '%s map reading guide has canonical metadata, sources and a contact link',
  async (locale) => {
    const slug = GUIDE.readGeologicalMap;
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    expect(article?.citations).toEqual([
      'https://home.wgnhs.wisc.edu/wisconsin-geology/how-to-read-geologic-map/',
      'https://pubs.usgs.gov/tm/2006/11A02/',
      'https://www.bgs.ac.uk/map-viewers/bgs-geology-viewer/',
    ]);
    const params = Promise.resolve({ locale, slug });
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(
      `https://qaznedr.kz/${locale}/insights/${slug}`
    );
    expect(metadata.description).toBe(article?.description);
    const html = renderToStaticMarkup(await InsightArticlePage({ params }));
    expect(html).toContain(`href="/${locale}/contact?guide=${slug}"`);
    expect(html.match(/<h1\b/g) ?? []).toHaveLength(1);
    expect(html).toContain(`href="/${locale}/insights/${GUIDE.geologicalMap}"`);
  }
);

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  '%s geological map guide links to the map reading guide',
  (locale) => {
    expect(getArticle(GUIDE.geologicalMap, locale)?.html).toContain(
      `href="/${locale}/insights/${GUIDE.readGeologicalMap}"`
    );
  }
);
