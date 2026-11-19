import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  MANIFEST_PATH,
  NOINDEX_HEADERS,
  OFFER_BUCKET,
  countsAsOpen,
  parseManifest,
  type OfferFile,
  type OfferManifest,
} from './manifest';

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function loadManifest(): Promise<{
  db: SupabaseClient;
  manifest: OfferManifest;
} | null> {
  const db = serviceClient();
  if (!db) return null;
  // Direct fetch with a unique query: the storage CDN can keep serving the
  // previous manifest for a while after an overwrite (measured 19.11).
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  try {
    const res = await fetch(
      `${base}/storage/v1/object/authenticated/${OFFER_BUCKET}/${MANIFEST_PATH}?t=${Date.now()}`,
      { headers: { Authorization: `Bearer ${key}`, apikey: key }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const manifest = parseManifest(await res.text());
    return manifest ? { db, manifest } : null;
  } catch {
    return null;
  }
}

export async function signedUrl(
  db: SupabaseClient,
  file: OfferFile,
  seconds: number,
  download: boolean
): Promise<string | null> {
  const { data } = await db.storage
    .from(OFFER_BUCKET)
    .createSignedUrl(file.path, seconds, download ? { download: file.name } : undefined);
  return data?.signedUrl ?? null;
}

/** One row per human open: document and version only, no IP or user agent. */
export async function recordOpen(
  db: SupabaseClient,
  request: Request,
  doc: string,
  version: string
): Promise<void> {
  if (!countsAsOpen(request.method, request.headers.get('user-agent'))) return;
  // Clicks from the partner page itself (?m=1) are not buyer opens.
  if (new URL(request.url).searchParams.has('m')) return;
  try {
    await db.from('offer_opens').insert({ doc, version });
  } catch {
    // The counter never blocks the download.
  }
}

export async function openCounts(
  db: SupabaseClient
): Promise<Record<string, { total: number; week: number }>> {
  const out: Record<string, { total: number; week: number }> = {};
  const { data } = await db
    .from('offer_opens')
    .select('doc, at')
    .order('at', { ascending: false })
    .limit(5000);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const row of (data ?? []) as { doc: string; at: string }[]) {
    const c = (out[row.doc] ??= { total: 0, week: 0 });
    c.total += 1;
    if (Date.parse(row.at) >= weekAgo) c.week += 1;
  }
  return out;
}

export function notFound(): Response {
  return new Response('Not found', { status: 404, headers: NOINDEX_HEADERS });
}

export async function redirectToFile(
  request: Request,
  doc: string,
  file: OfferFile | undefined,
  db: SupabaseClient
): Promise<Response> {
  if (!file) return notFound();
  const url = await signedUrl(db, file, 300, true);
  if (!url) return new Response('Unavailable', { status: 503, headers: NOINDEX_HEADERS });
  await recordOpen(db, request, doc, file.version);
  return new Response(null, {
    status: 302,
    headers: { ...NOINDEX_HEADERS, Location: url },
  });
}
