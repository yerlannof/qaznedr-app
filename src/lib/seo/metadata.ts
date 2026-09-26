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

export function buildLanguageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = localeUrl(l, path);
  languages['x-default'] = localeUrl('ru', path);
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
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = localeUrl(input.locale, input.path);
  const fullTitle = input.absoluteTitle
    ? input.title
    : `${input.title} | ${SITE_NAME}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(input.path),
    },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[input.locale],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
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
