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
  '%s core drilling guide has canonical metadata and a contextual contact link',
  async (locale) => {
    const slug = GUIDE.coreDrilling;
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    const params = Promise.resolve({ locale, slug });
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(
      `https://qaznedr.kz/${locale}/insights/${slug}`
    );
    expect(metadata.description).toBe(article?.description);
    const html = renderToStaticMarkup(await InsightArticlePage({ params }));
    expect(html).toContain(`href="/${locale}/contact?guide=${slug}"`);
    expect(html.match(/<h1\b/g) ?? []).toHaveLength(1);
    expect(html).toContain('https://www.usgs.gov/core-research-center/about');
    expect(html).toContain('https://www.jorc.org/docs/JORC_code_2012.pdf');
  }
);
