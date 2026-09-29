import type { Locale } from '@/lib/seo/site';

// Article-level facts. No fs here: the middleware (edge), the sitemap and
// client components read this file. Texts live in content/insights/<slug>/.

export type InsightCategory = 'law' | 'licensing' | 'geology';

export interface InsightEntry {
  slug: string;
  category: InsightCategory;
  /** ISO dates, shared by all languages of the article. */
  published: string;
  updated: string;
  /** Shows the "not legal advice, as of <updated>" note. */
  legal: boolean;
  /** ISO date the cited rules were last checked against the current law
   * (the legal note's "as of"). Required when `legal` is true. */
  lawAsOf?: string;
  /** Languages with a content/insights/<slug>/<locale>.md file. */
  locales: readonly Locale[];
}

export const GUIDE = {
  foreignInvestor: 'foreign-investor-subsoil-rights-kazakhstan',
  explorationLicence: 'solid-minerals-exploration-licence-kazakhstan',
  reserveClassification: 'reserve-classification-gkz-kazrc-jorc-gbt17766',
  rightsTransfer: 'subsoil-rights-transfer-permission-kazakhstan',
  geologicalMap: 'geological-map-kazakhstan',
  whatIsGeology: 'what-is-geology',
  artisanalMining: 'artisanal-mining-licence-kazakhstan',
  pugfn: 'pugfn-subsoil-fund-program-kazakhstan',
} as const;

export type GuideKey = keyof typeof GUIDE;
export const GUIDE_KEYS = Object.keys(GUIDE) as GuideKey[];

const WRITTEN: readonly Locale[] = ['ru', 'en', 'zh', 'kz'];

export const INSIGHTS: readonly InsightEntry[] = [
  {
    slug: GUIDE.foreignInvestor,
    category: 'law',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: true,
    lawAsOf: '2026-09-26',
    locales: WRITTEN,
  },
  {
    slug: GUIDE.explorationLicence,
    category: 'licensing',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: true,
    lawAsOf: '2026-09-26',
    locales: WRITTEN,
  },
  {
    slug: GUIDE.reserveClassification,
    category: 'geology',
    published: '2026-09-26',
    updated: '2026-09-26',
    legal: false,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.rightsTransfer,
    category: 'law',
    published: '2026-09-26',
    updated: '2026-09-29',
    legal: true,
    lawAsOf: '2026-09-29',
    locales: WRITTEN,
  },
  {
    slug: GUIDE.geologicalMap,
    category: 'geology',
    published: '2026-09-28',
    updated: '2026-09-29',
    legal: false,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.whatIsGeology,
    category: 'geology',
    published: '2026-09-29',
    updated: '2026-09-29',
    legal: false,
    locales: WRITTEN,
  },
  {
    slug: GUIDE.artisanalMining,
    category: 'licensing',
    published: '2026-09-29',
    updated: '2026-09-29',
    legal: true,
    lawAsOf: '2026-09-29',
    locales: WRITTEN,
  },
  {
    slug: GUIDE.pugfn,
    category: 'licensing',
    published: '2026-09-29',
    updated: '2026-09-29',
    legal: true,
    lawAsOf: '2026-09-29',
    locales: WRITTEN,
  },
];

/** Where a reader lands when the article has no version in their language. */
export const INSIGHT_FALLBACK_LOCALE: Locale = 'ru';

export function findInsight(slug: string): InsightEntry | undefined {
  return INSIGHTS.find((entry) => entry.slug === slug);
}

/** Link to a guide in the reader's language, or straight to its fallback
 * version, so pages never link through the middleware's 308. */
export function insightHref(locale: string, slug: string): string {
  const entry = findInsight(slug);
  const written = entry?.locales.some((l) => l === locale) ?? false;
  return `/${written ? locale : INSIGHT_FALLBACK_LOCALE}/insights/${slug}`;
}
