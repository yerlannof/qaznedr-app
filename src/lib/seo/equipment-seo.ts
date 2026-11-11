import { translate } from '@/lib/i18n/translations';
import {
  DEFAULT_LOCALE,
  HREFLANG,
  isLocale,
  localeUrl,
  type Locale,
} from './site';

/**
 * Marketplace listings and company profiles carry their author's text in one
 * language, shown unchanged under every locale URL. Only the URL in that
 * language is indexable; the other three point their canonical at it.
 */

/** Company profiles are written in Russian. */
export const COMPANY_PAGE_LOCALE: Locale = DEFAULT_LOCALE;

/** Language the author wrote the listing in; Russian when not recorded. */
export function listingSourceLocale(listing: {
  sourceLanguage?: string | null;
}): Locale {
  return isLocale(listing.sourceLanguage ?? undefined)
    ? (listing.sourceLanguage as Locale)
    : DEFAULT_LOCALE;
}

export const listingPath = (id: string) => `/equipment/${id}`;
export const companyPath = (slug: string) => `/equipment/company/${slug}`;

/** The one indexable URL of a listing. */
export function listingCanonicalUrl(listing: {
  id: string;
  sourceLanguage?: string | null;
}): string {
  return localeUrl(listingSourceLocale(listing), listingPath(listing.id));
}

/** The one indexable URL of a company profile. */
export const companyCanonicalUrl = (slug: string) =>
  localeUrl(COMPANY_PAGE_LOCALE, companyPath(slug));

/** Home → Equipment and services: the first crumbs of every marketplace page. */
export function equipmentBreadcrumb(locale: Locale) {
  return [
    { name: translate(locale, 'navigation.home'), url: localeUrl(locale) },
    {
      name: translate(locale, 'equipmentCatalog.eyebrow'),
      url: localeUrl(locale, '/equipment'),
    },
  ];
}

/** The listings rendered on one catalogue page, each by its indexable URL. */
export function equipmentCatalogueJsonLd(input: {
  locale: Locale;
  name: string;
  description: string;
  url: string;
  /** Position of the page's first item minus one (24 on page two). */
  offset: number;
  items: readonly {
    id: string;
    title?: string;
    sourceLanguage?: string | null;
  }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    inLanguage: HREFLANG[input.locale],
    url: input.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: input.offset + index + 1,
        ...(item.title && { name: item.title }),
        url: listingCanonicalUrl(item),
      })),
    },
  };
}

const SEPARATOR = ' · ';
const ELLIPSIS = '…';

/**
 * Generated listing facts followed by the beginning of the author's own text,
 * so listings of one company with the same facts get distinct descriptions.
 * Whitespace is collapsed and the text cut at a word boundary to keep the
 * whole within `max` characters; nothing else is added. Without text, or
 * without room for one word, the prefix is returned unchanged.
 */
export function appendExcerpt(
  prefix: string,
  text: string | undefined,
  max = 160
): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  const room = max - prefix.length - SEPARATOR.length;
  if (!clean || room <= 0) return prefix;
  if (clean.length <= room) return prefix + SEPARATOR + clean;
  // One character past the room shows whether the last word ends there.
  const cut = clean.slice(0, room - ELLIPSIS.length + 1);
  const boundary = cut.lastIndexOf(' ');
  if (boundary <= 0) return prefix;
  const words = cut.slice(0, boundary).replace(/[\s.,;:!?—–-]+$/, '');
  return words ? prefix + SEPARATOR + words + ELLIPSIS : prefix;
}
