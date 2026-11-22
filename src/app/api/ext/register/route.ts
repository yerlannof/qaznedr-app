import { register } from '@/lib/ext-block/store';

export const dynamic = 'force-dynamic';

/** Extension install key (T-0220). Random, not tied to a person. */
export async function POST(request: Request) {
  return register(request);
}
