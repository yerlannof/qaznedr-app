import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/i18n/translations';
import {
  HREFLANG,
  LOCALES,
  OG_LOCALE,
  SITE_NAME,
  localeUrl,
  toLocale,
  type Locale,
} from './site';
import { OG_ALT, OG_SIZE, ogImageUrl } from './og';

export function buildLanguageAlternates(
  path: string,
  locales: readonly Locale[] = LOCALES
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[HREFLANG[l]] = localeUrl(l, path);
  languages['x-default'] = localeUrl(
    locales.includes('ru') ? 'ru' : locales[0],
    path
  );
  return languages;
}

export interface PageMetadataInput {
  locale: Locale;
  /** '' for the home page, otherwise a sub-path such as '/leads' */
  path: string;
  title: string;
  description: string;
  /** Skip the "%s | QAZNEDR HOLDING" template (home page). */
  absoluteTitle?: boolean;
  noindex?: boolean;
  /** Languages the page exists in (hreflang). Defaults to every locale. */
  locales?: readonly Locale[];
  /** Sub-path with its own opengraph-image route (guides); by default the
   * locale card. */
  ogImagePath?: string;
  /** ISO dates of an article; switches og:type to "article". */
  article?: { published: string; modified: string };
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = localeUrl(input.locale, input.path);
  // A page's own openGraph replaces the file-based card of its segment, so
  // every page names its card explicitly.
  const image = {
    url: ogImageUrl(input.locale, input.ogImagePath),
    ...OG_SIZE,
    alt: input.ogImagePath ? input.title : OG_ALT,
  };
  const fullTitle =
    input.absoluteTitle || input.title.includes(SITE_NAME)
      ? input.title
      : `${input.title} | ${SITE_NAME}`;
  const openGraph = {
    title: fullTitle,
    description: input.description,
    url,
    siteName: SITE_NAME,
    locale: OG_LOCALE[input.locale],
    images: [image],
  };
  return {
    // Absolute on purpose: nested layouts that set their own title drop the
    // root "%s | QAZNEDR HOLDING" template, so the suffix is added here.
    title: { absolute: fullTitle },
    description: input.description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(input.path, input.locales),
    },
    openGraph: input.article
      ? {
          ...openGraph,
          type: 'article',
          publishedTime: input.article.published,
          modifiedTime: input.article.modified,
        }
      : { ...openGraph, type: 'website' },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      images: [image.url],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** Metadata from the `seo.<key>.title|description` translation keys. */
export function buildTranslatedPageMetadata(
  localeParam: string,
  path: string,
  seoKey: string,
  options: Pick<PageMetadataInput, 'absoluteTitle' | 'noindex'> = {}
): Metadata {
  const locale = toLocale(localeParam);
  const { t } = getServerTranslation(locale);
  return buildPageMetadata({
    locale,
    path,
    title: t(`seo.${seoKey}.title`),
    description: t(`seo.${seoKey}.description`),
    ...options,
  });
}
