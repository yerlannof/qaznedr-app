import { LOCALES } from './site';

/** Indexable pages (without locale prefix). Drives sitemap.xml. */
export const PUBLIC_PAGES = [
  '',
  '/leads',
  '/services',
  '/services/geological',
  '/services/legal',
  '/about',
  '/contact',
  '/faq',
  '/legal/terms',
  '/insights',
  '/minerals/gold',
  '/minerals/copper',
  '/minerals/lead-zinc',
  '/minerals/molybdenum',
  '/minerals/tungsten',
  '/minerals/iron',
] as const;

/**
 * Legacy marketplace routes hidden after the holding pivot (spec §4).
 * prefix → replacement, both without locale. The code behind them is kept;
 * delete an entry here to bring a section back.
 */
export const HIDDEN_ROUTE_REDIRECTS: ReadonlyArray<readonly [string, string]> =
  [
    ['/listings', '/leads'],
    ['/companies', '/about'],
    ['/services/catalog', '/services'],
    ['/services/equipment', '/services'],
    ['/map', '/leads'],
    ['/favorites', '/leads'],
    ['/messages', '/contact'],
    ['/dashboard', '/leads'],
    ['/auth/register', '/contact'],
    ['/support', '/contact'],
    ['/services/investors', '/contact'],
    // Session 3: invented blog/news/courses replaced by the guides section.
    ['/blog', '/insights'],
    ['/education', '/insights'],
    ['/knowledge', '/insights'],
    ['/news', '/insights'],
  ];

const LOCALE_PATH = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);

export function hiddenRouteRedirect(pathname: string): string | null {
  const match = pathname.match(LOCALE_PATH);
  if (!match) return null;
  const [, locale, rest = ''] = match;
  for (const [prefix, target] of HIDDEN_ROUTE_REDIRECTS) {
    if (rest === prefix || rest.startsWith(`${prefix}/`)) {
      return `/${locale}${target}`;
    }
  }
  return null;
}

const TRACKING_PARAM = /^(utm_[a-z_]+|gclid|yclid|fbclid|msclkid)$/i;

/** Campaign tags of a query string (`?utm_source=…`), or '' if none. Old
 * marketplace filters are dropped: an unknown ?region= on the new pages
 * would show an empty list instead of all areas. */
export function trackingQuery(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  params.forEach((value, key) => {
    if (TRACKING_PARAM.test(key)) kept.append(key, value);
  });
  const query = kept.toString();
  return query ? `?${query}` : '';
}
