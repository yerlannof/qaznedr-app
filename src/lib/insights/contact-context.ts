import { translate } from '@/lib/i18n/translations';
import { isLocale, type Locale } from '@/lib/seo/site';
import type { ServiceTopic } from '@/lib/services/topics';
import { GUIDE, GUIDE_KEYS, findInsight } from './registry';

/** A public guide slug only; arrays and arbitrary query text are rejected. */
export function getGuideSlug(value: unknown): string | undefined {
  return typeof value === 'string' && findInsight(value) ? value : undefined;
}

export function guideTitle(locale: Locale, slug: string): string | undefined {
  const key = GUIDE_KEYS.find((name) => GUIDE[name] === slug);
  return key ? translate(locale, `insights.links.${key}`) : undefined;
}

export function guideSourcePath(
  locale: Locale,
  slug: string
): string | undefined {
  return getGuideSlug(slug) ? `/${locale}/insights/${slug}` : undefined;
}

export function guideContactHref(
  locale: string,
  slug?: string,
  serviceTopic?: ServiceTopic
): string {
  const query = new URLSearchParams();
  if (serviceTopic) query.set('service', serviceTopic);
  if (slug && getGuideSlug(slug)) query.set('guide', slug);
  const search = query.toString();
  return `/${locale}/contact${search ? `?${search}` : ''}`;
}

/** Only the existing service routes can carry public guide context. */
export type ServicePath =
  | '/services'
  | '/services/legal'
  | '/services/geological'
  | `/services#${string}`;

export function guideServiceHref(
  locale: string,
  path: ServicePath,
  slug?: string
): string {
  const [servicePath, anchor] = path.split('#');
  const guide = getGuideSlug(slug);
  return `/${locale}${servicePath}${guide ? `?guide=${encodeURIComponent(guide)}` : ''}${anchor ? `#${anchor}` : ''}`;
}

export function guideFromPath(pathname: string): string | undefined {
  const match = /^\/(ru|kz|en|zh)\/insights\/([a-z0-9-]+)\/?$/.exec(pathname);
  if (!match || !isLocale(match[1])) return undefined;
  return getGuideSlug(match[2]);
}
