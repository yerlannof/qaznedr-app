import { blockInfo } from '@/lib/ext-block/store';

export const dynamic = 'force-dynamic';

/** Teaser for one 1′ block of the exploration grid (T-0220): ranges, metals, stage — no names or coordinates. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return blockInfo(request, code);
}
