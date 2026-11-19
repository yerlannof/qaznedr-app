import { isPublicDoc } from '@/lib/offer-files/manifest';
import { loadManifest, notFound, redirectToFile } from '@/lib/offer-files/store';

export const dynamic = 'force-dynamic';

/** /offer/ru|en|zh → always the latest main-list PDF (download name has the version). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doc: string }> }
) {
  const { doc } = await params;
  if (!isPublicDoc(doc)) return notFound();
  const loaded = await loadManifest();
  if (!loaded) return notFound();
  return redirectToFile(request, doc, loaded.manifest.docs[doc], loaded.db);
}
