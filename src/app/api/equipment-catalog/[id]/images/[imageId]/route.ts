import { z } from 'zod';
import { getActiveListing } from '@/lib/equipment-listings/catalog-repository';
import { readImage } from '@/lib/equipment-listings/image-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string; imageId: string }> };
const uuid = z.string().uuid();
const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });

/** Photos of published listings only; the bucket itself stays private. */
export async function GET(_request: Request, context: Context) {
  if (
    process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true' ||
    process.env.EQUIPMENT_CATALOG_ENABLED !== 'true'
  )
    return notFound();
  const { id, imageId } = await context.params;
  if (!uuid.safeParse(id).success || !uuid.safeParse(imageId).success)
    return notFound();
  try {
    if (!(await getActiveListing(id))) return notFound();
    const buffer = await readImage(id, imageId);
    if (!buffer) return notFound();
    return new Response(Uint8Array.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        // Short shared cache: an archived listing's photos disappear within the hour.
        'Cache-Control': 'public, max-age=600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
