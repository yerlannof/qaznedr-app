import { INSIGHT_FALLBACK_LOCALE, findInsight } from './registry';

const ARTICLE_PATH = /^\/(ru|kz|en|zh)\/insights\/([\w-]+)\/?$/;

/**
 * A guide opened in a language it is not written in (the footer language
 * switcher keeps the path) → its ru version instead of a 404.
 */
export function insightLocaleRedirect(pathname: string): string | null {
  const match = ARTICLE_PATH.exec(pathname);
  if (!match) return null;
  const [, locale, slug] = match;
  const entry = findInsight(slug);
  if (!entry || (entry.locales as readonly string[]).includes(locale)) {
    return null;
  }
  return `/${INSIGHT_FALLBACK_LOCALE}/insights/${slug}`;
}
