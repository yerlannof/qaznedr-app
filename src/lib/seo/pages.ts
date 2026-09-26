import { LOCALES } from './site';

/** Indexable pages (without locale prefix). Drives sitemap.xml. */
export const PUBLIC_PAGES = [
  '',
  '/leads',
  '/services',
  '/services/geological',
  '/services/legal',
  '/services/investors',
  '/about',
  '/contact',
  '/faq',
  '/support',
  '/legal/terms',
  '/blog',
  '/education',
  '/knowledge',
  '/news',
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
