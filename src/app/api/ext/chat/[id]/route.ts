import { chatGet } from '@/lib/ext-block/store';

export const dynamic = 'force-dynamic';

/** Showcase chat (T-0220): status and answer of one queued question. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return chatGet(request, id);
}
