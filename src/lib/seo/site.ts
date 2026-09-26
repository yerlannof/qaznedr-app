// Single source of truth for the public site URL, locales and their
// language codes. Used by metadata, sitemap, robots and middleware.

export const SITE_URL = 'https://qaznedr.kz';
export const SITE_NAME = 'QAZNEDR HOLDING';
// Confirmed by the owner on 2026-09-27.
export const INSTAGRAM_URL = 'https://www.instagram.com/qaznedr.kz/';

export const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

/** BCP 47 codes for <html lang> and hreflang. URL segments stay ru/kz/en/zh. */
export const HREFLANG: Record<Locale, string> = {
  ru: 'ru',
  kz: 'kk',
  en: 'en',
  zh: 'zh-CN',
};

export const OG_LOCALE: Record<Locale, string> = {
  ru: 'ru_KZ',
  kz: 'kk_KZ',
  en: 'en_US',
  zh: 'zh_CN',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Absolute URL for a locale-prefixed path. `path` is '' or a sub-path. */
export function localeUrl(locale: Locale, path = ''): string {
  const trimmed = path.replace(/\/+$/, '');
  const clean = trimmed && !trimmed.startsWith('/') ? `/${trimmed}` : trimmed;
  return `${SITE_URL}/${locale}${clean}`;
}
