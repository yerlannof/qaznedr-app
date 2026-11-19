import { keyMatches } from '@/lib/offer-files/manifest';
import { loadManifest, notFound, redirectToFile } from '@/lib/offer-files/store';

export const dynamic = 'force-dynamic';

/** Unlisted link to the second list («Объекты для поисков»); key lives in the manifest. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const loaded = await loadManifest();
  if (!loaded || !keyMatches(key, loaded.manifest.keys.search)) return notFound();
  return redirectToFile(request, 'search_ru', loaded.manifest.docs.search_ru, loaded.db);
}
