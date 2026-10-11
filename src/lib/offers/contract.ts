import { z } from 'zod';
import { localized, localizedList } from '@/lib/leads/showcase';
import { CATALOG_STAGES, COMMODITY_GROUPS } from '@/lib/catalog/types';

// Public card of an operating asset offered for sale by its owner (package
// "qaznedr-offer-v1", approved design 18). Russian is the owner-approved
// source text; KZ/EN/ZH are equivalent translations. The card is anonymised:
// no company, people, document numbers or exact coordinates — those live only
// in the gitignored dossier (data/offers/v1/<code>/), never in this repo.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// Media are served from public/offers/<code>/ with a content hash for caching.
const mediaPath = z
  .string()
  .regex(/^\/offers\/QN-A\d{2,}\/[a-z0-9-]+\.(?:webp|mp4)$/);
const hash = z.string().regex(/^[0-9a-f]{12}$/);

const pair = z.object({ label: localized, value: localized });

export const offerSchema = z
  .object({
    package: z.literal('qaznedr-offer-v1'),
    code: z.string().regex(/^QN-A\d{2,}$/),
    status: z.enum(['published', 'withdrawn', 'sold']),
    sort_order: z.number().int(),
    published_at: isoDate,
    commodity: z.array(z.string().min(1)).min(1),
    commodity_group: z.enum(COMMODITY_GROUPS),
    stage: z.enum(CATALOG_STAGES),
    region: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/),
    has_infrastructure: z.boolean(),
    badge: localized,
    title: localized,
    h1: localized,
    summary_line: localized,
    intro: localized,
    key_figures: z.array(pair).length(3),
    facts_table: z.array(pair).min(1),
    reserve_note: localized,
    sections: z
      .array(z.object({ title: localized, items: localizedList }))
      .min(1),
    assets_note: localized.optional(),
    rights: z.object({
      card_line: localized,
      items: localizedList,
      checked_at: isoDate,
      basis: localized,
    }),
    nda_documents: localizedList,
    legal: localized,
    video: z
      .object({
        url: mediaPath,
        poster: mediaPath,
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        duration_s: z.number().int().positive(),
        v: hash,
        caption: localized,
      })
      .optional(),
    images: z.array(
      z.object({
        url: mediaPath,
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        v: hash,
        alt: localized,
      })
    ),
    media_credit: localized,
    whatsapp_text: localized,
    seo: z.object({ title: localized, description: localized }),
  })
  .refine(
    (o) => o.images.every((i) => i.url.startsWith(`/offers/${o.code}/`)),
    {
      message: 'media must live under the card’s own folder',
    }
  );

export type AssetOffer = z.infer<typeof offerSchema>;

/** A card is shown only when the whole contract validates. */
export function parseOffer(raw: unknown): AssetOffer | null {
  const parsed = offerSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function mediaSrc(m: { url: string; v: string }): string {
  return `${m.url}?v=${m.v}`;
}
