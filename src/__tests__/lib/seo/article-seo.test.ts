import { buildLanguageAlternates, buildPageMetadata } from '@/lib/seo/metadata';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/article-jsonld';

describe('buildLanguageAlternates', () => {
  it('limits hreflang to the given locales, x-default → ru', () => {
    expect(buildLanguageAlternates('/insights/x', ['ru', 'en', 'zh'])).toEqual({
      ru: 'https://qaznedr.kz/ru/insights/x',
      en: 'https://qaznedr.kz/en/insights/x',
      'zh-CN': 'https://qaznedr.kz/zh/insights/x',
      'x-default': 'https://qaznedr.kz/ru/insights/x',
    });
  });

  it('still covers every locale by default', () => {
    expect(Object.keys(buildLanguageAlternates('/faq'))).toEqual([
      'ru',
      'kk',
      'en',
      'zh-CN',
      'x-default',
    ]);
  });
});

describe('buildPageMetadata for an article', () => {
  const meta = buildPageMetadata({
    locale: 'zh',
    path: '/insights/x',
    title: '标题',
    description: '描述',
    locales: ['ru', 'en', 'zh'],
    article: { published: '2026-09-26', modified: '2026-09-27' },
  });

  it('marks og:type article with dates', () => {
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-09-26',
      modifiedTime: '2026-09-27',
      locale: 'zh_CN',
    });
  });

  it('has no kk alternate', () => {
    expect(meta.alternates?.languages).not.toHaveProperty('kk');
    expect(meta.alternates?.canonical).toBe('https://qaznedr.kz/zh/insights/x');
  });
});

describe('articleJsonLd', () => {
  const { article, breadcrumb } = articleJsonLd({
    slug: 'x',
    locale: 'en',
    title: 'Title',
    description: 'Desc',
    published: '2026-09-26',
    updated: '2026-09-27',
  });

  it('describes an Article by the holding', () => {
    expect(article).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Title',
      description: 'Desc',
      inLanguage: 'en',
      datePublished: '2026-09-26',
      dateModified: '2026-09-27',
      mainEntityOfPage: 'https://qaznedr.kz/en/insights/x',
      isAccessibleForFree: true,
      author: { '@type': 'Organization', name: 'QAZNEDR HOLDING' },
      publisher: { '@type': 'Organization', name: 'QAZNEDR HOLDING' },
    });
  });

  it('builds home → guides → article breadcrumbs', () => {
    expect(breadcrumb).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, item: 'https://qaznedr.kz/en' },
        { position: 2, item: 'https://qaznedr.kz/en/insights' },
        {
          position: 3,
          name: 'Title',
          item: 'https://qaznedr.kz/en/insights/x',
        },
      ],
    });
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers items from 1', () => {
    expect(
      breadcrumbJsonLd([{ name: 'A', url: 'https://qaznedr.kz/ru' }])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'A',
          item: 'https://qaznedr.kz/ru',
        },
      ],
    });
  });
});
