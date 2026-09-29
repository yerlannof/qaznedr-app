import { z } from 'zod';
import type { Locale } from '@/lib/seo/site';
import { leadMineralName } from '@/lib/seo/lead-metadata';

// Public showcase card (geobase package "qaznedr-showcase-v1"), stored in
// leads.showcase. Russian is the source text; other locales are optional
// reviewed translations. The contract forbids rewriting numbers, their type
// words or caveats, so rendering only picks and splits — it never composes.

const localized = z.object({
  ru: z.string().min(1),
  kz: z.string().min(1).optional(),
  en: z.string().min(1).optional(),
  zh: z.string().min(1).optional(),
});

const localizedList = z.object({
  ru: z.array(z.string().min(1)),
  kz: z.array(z.string().min(1)).optional(),
  en: z.array(z.string().min(1)).optional(),
  zh: z.array(z.string().min(1)).optional(),
});

export const HEADLINE_TYPES = [
  'spike',
  'average',
  'best_interval',
  'forecast',
  'reserve',
  'unknown',
] as const;

const showcaseSchema = z.object({
  package: z.string().min(1),
  card_id: z.string().regex(/^QN-\d{2,}$/),
  commodity: z.array(z.string().min(1)).min(1),
  commodity_ru: z.string().min(1).optional(),
  oblast: localized,
  zone: z.object({
    center_lat: z.number().min(40).max(56),
    center_lon: z.number().min(46).max(88),
    radius_km: z.number().positive().max(200),
  }),
  headline: localized,
  headline_type: z.enum(HEADLINE_TYPES),
  object_type: localized.nullable(),
  facts: localizedList,
  satellite: localizedList.optional(),
  source: localized.nullable(),
  images: z.array(
    z.object({
      url: z.url({ protocol: /^https$/ }),
      caption: localized,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      v: z.string().regex(/^[0-9a-f]{12}$/),
    })
  ),
  rights: z.object({
    status: localized,
    checked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  whatsapp_text: localized,
  featured: z
    .object({ rank: z.number().int().positive(), fact: localized })
    .optional(),
});

export type Showcase = z.infer<typeof showcaseSchema>;
export type HeadlineType = Showcase['headline_type'];
export type Localized = z.infer<typeof localized>;
export type LocalizedList = z.infer<typeof localizedList>;

/** A card is shown only when the whole contract is present. */
export function parseShowcase(raw: unknown): Showcase | null {
  const parsed = showcaseSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Locale text, or the Russian source marked with lang="ru". */
export function pickText(
  value: Localized,
  locale: Locale
): { text: string; lang: 'ru' | undefined } {
  const own = value[locale];
  return own ? { text: own, lang: undefined } : { text: value.ru, lang: 'ru' };
}

/** A translated list is used only when it matches the source line for line. */
export function pickList(
  value: LocalizedList,
  locale: Locale
): { items: string[]; lang: 'ru' | undefined } {
  const own = value[locale];
  return own && own.length === value.ru.length
    ? { items: own, lang: undefined }
    : { items: value.ru, lang: 'ru' };
}

/** "Type of value: number" → both halves verbatim, split at the first colon. */
export function splitHeadline(text: string): { type: string; value: string } {
  const match = /^(.+?[:：])\s*(.+)$/.exec(text);
  return match
    ? { type: match[1], value: match[2] }
    : { type: '', value: text };
}

export function formatRightsDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * "Золото, медь" / "Gold, copper" / "金、铜". Russian prefers the delivered
 * commodity_ru; unknown codes are kept verbatim (never lowercased).
 */
export function commodityLabel(
  commodity: string[],
  locale: Locale,
  ruLabel?: string
): string {
  if (locale === 'ru' && ruLabel) return ruLabel;
  const names = commodity.map((code) => ({
    code,
    name: leadMineralName(code, locale),
  }));
  if (locale === 'zh') return names.map((n) => n.name).join('、');
  return names
    .map((n, i) =>
      i === 0 || n.name === n.code ? n.name : n.name.toLowerCase()
    )
    .join(', ');
}

/**
 * A row that carries any showcase value is a showcase row even when the value
 * fails validation: it must then be hidden, never rendered by the legacy card
 * (which would print a bare "free" badge and number without caveats).
 */
export function isShowcaseRow(row: { showcase?: unknown }): boolean {
  return row.showcase !== null && row.showcase !== undefined;
}

/**
 * Public API shape: the circle centre is drawn on the page but is not handed
 * to agents as plain coordinates they could quote as the object location.
 * Legacy tier/exclusivity codes (internal jargon such as "TIER2_BOMB") and the
 * bare license_status code are dropped too: the card carries its own rights
 * text with the check date and caveat.
 */
export function apiTeaser<
  T extends { showcase?: unknown; map_centroid?: unknown },
>(row: T): T {
  if (!isShowcaseRow(row)) return row;
  const card = { ...(row.showcase as Record<string, unknown>) };
  delete card.zone;
  return {
    ...row,
    map_centroid: null,
    tier: null,
    exclusivity: null,
    license_status: null,
    showcase: card,
  };
}
