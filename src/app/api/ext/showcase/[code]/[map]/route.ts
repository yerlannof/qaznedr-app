import { showcaseMap } from '@/lib/ext-block/store';

export const dynamic = 'force-dynamic';

/** Showcase overlay picture for one block (T-0220): only for install keys with the showcase flag. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string; map: string }> }) {
  const { code, map } = await params;
  return showcaseMap(request, code, map);
}
