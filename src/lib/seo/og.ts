import { translate } from '@/lib/i18n/translations';
import { SITE_NAME, localeUrl, type Locale } from './site';

// Shared by the og-image routes (edge and node) and page metadata.
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = SITE_NAME;
export const OG_VERSION = '20260927-areas';

const BRAND_PREFIX = /^QAZNEDR HOLDING\s*[—–-]\s*/;

/** The approved home title (seo.home.title) without the brand prefix,
 * capitalised: after the dash it starts lower-case in ru and kz. */
export function ogHomeTitle(locale: Locale): string {
  const title = translate(locale, 'seo.home.title').replace(BRAND_PREFIX, '');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const WIDE = /[⺀-鿿豈-﫿＀-￯]/;

/** Font size that keeps a title within three lines of the 1040px text box. */
export function ogTitleSize(title: string): number {
  const units = Array.from(title).reduce(
    (n, ch) => n + (WIDE.test(ch) ? 2 : 1),
    0
  );
  if (units > 70) return 44;
  if (units > 40) return 52;
  return 64;
}

/** The card drawn by `<path>/opengraph-image` ('' = the locale card). */
export function ogImageUrl(locale: Locale, path = ''): string {
  return `${localeUrl(locale, `${path}/opengraph-image`)}?v=${OG_VERSION}`;
}
