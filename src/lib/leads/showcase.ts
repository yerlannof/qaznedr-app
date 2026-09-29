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

/** "Золото, медь" / "Gold, copper" / "金、铜" from the commodity codes. */
export function commodityLabel(commodity: string[], locale: Locale): string {
  const names = commodity.map((code) => leadMineralName(code, locale));
  if (locale === 'zh') return names.join('、');
  return [names[0], ...names.slice(1).map((n) => n.toLowerCase())].join(', ');
}
