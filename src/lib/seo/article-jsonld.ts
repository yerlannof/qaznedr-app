import { translate } from '@/lib/i18n/translations';
import { HREFLANG, SITE_NAME, SITE_URL, localeUrl, type Locale } from './site';

const HOLDING = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Home → Guides, the first two crumbs of every /insights page. */
export function insightsBreadcrumb(locale: Locale) {
  return [
    { name: translate(locale, 'navigation.home'), url: localeUrl(locale) },
    {
      name: translate(locale, 'insights.breadcrumb'),
      url: localeUrl(locale, '/insights'),
    },
  ];
}

export interface ArticleJsonLdInput {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  published: string;
  updated: string;
}

export function articleJsonLd(input: ArticleJsonLdInput) {
  const url = localeUrl(input.locale, `/insights/${input.slug}`);
  return {
    article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: input.title,
      description: input.description,
      inLanguage: HREFLANG[input.locale],
      datePublished: input.published,
      dateModified: input.updated,
      mainEntityOfPage: url,
      url,
      isAccessibleForFree: true,
      author: HOLDING,
      publisher: HOLDING,
    },
    breadcrumb: breadcrumbJsonLd([
      ...insightsBreadcrumb(input.locale),
      { name: input.title, url },
    ]),
  };
}
