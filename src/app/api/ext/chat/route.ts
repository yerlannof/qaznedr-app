import { chatAsk } from '@/lib/ext-block/store';

export const dynamic = 'force-dynamic';

/** Showcase chat (T-0220): queue a question about a showcase block. */
export async function POST(request: Request) {
  return chatAsk(request);
}
