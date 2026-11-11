import { DEFAULT_LOCALE, isLocale, localeUrl, type Locale } from './site';

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
