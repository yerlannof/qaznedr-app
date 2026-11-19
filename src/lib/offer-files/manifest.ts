/**
 * Permanent links to the current buyer PDFs (T-0158). Files and the manifest
 * live in the private Supabase bucket `offer-files`; the manifest is written by
 * the publisher script on WSL (scripts/site_offer_publish.py in the data repo).
 * The hidden-page keys are kept only in that manifest, never in this repo.
 * Pure helpers here (no I/O) so they can be unit-tested.
 */
import { timingSafeEqual } from 'crypto';

export const OFFER_BUCKET = 'offer-files';
export const MANIFEST_PATH = 'manifest.json';

export type PublicDoc = 'ru' | 'en' | 'zh';
export const PUBLIC_DOCS: readonly PublicDoc[] = ['ru', 'en', 'zh'];

export interface OfferFile {
  path: string; // object path in the bucket
  name: string; // download file name, with version
  version: string;
  bytes: number;
}

export interface OfferManifest {
  published_at: string;
  docs: Partial<Record<PublicDoc | 'search_ru', OfferFile>>;
  status?: { version: string; files: OfferFile[] };
  keys: { search: string; muhtar: string };
}

export function isPublicDoc(doc: string): doc is PublicDoc {
  return (PUBLIC_DOCS as readonly string[]).includes(doc);
}

/** Constant-time key check; empty or short keys never match. */
export function keyMatches(given: string, expected: string | undefined): boolean {
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|vkshare|skype|curl|wget|python|headless/i;

/** Link previews and crawlers do not count as opens. */
export function countsAsOpen(method: string, userAgent: string | null): boolean {
  return method === 'GET' && !!userAgent && !BOT_UA.test(userAgent);
}

export function parseManifest(text: string): OfferManifest | null {
  try {
    const m = JSON.parse(text) as OfferManifest;
    if (!m || typeof m !== 'object' || !m.docs || !m.keys) return null;
    return m;
  } catch {
    return null;
  }
}

export const NOINDEX_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
};
