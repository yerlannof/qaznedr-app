import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createServiceClient } from '@/lib/supabase/server';
import { getActiveEntitlement } from '@/lib/leads/private-access';
import { getGoldCard } from '@/lib/gold/cards';

export const dynamic = 'force-dynamic';

// Scan crop of a gold card: only for a signed-in user with an ACTIVE entitlement on this card, and only a file
// listed in the card's own `crops`. Bytes are streamed (no storage URL leaves the server); every miss is a 404
// so the route does not tell which cards or files exist.
const NOT_FOUND = () =>
  NextResponse.json({ error: 'Not found' }, { status: 404 });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; file: string }> }
) {
  const { code, file } = await params;
  if (!/^AU-\d{4}$/.test(code) || !/^[A-Za-z0-9._-]+\.jpg$/.test(file)) {
    return NOT_FOUND();
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const card = await getGoldCard(code);
  if (!card || !card.crops.includes(file)) return NOT_FOUND();
  const ent = await getActiveEntitlement(userId, code);
  if (!ent) return NOT_FOUND();

  const svc: any = await createServiceClient();
  const { data, error } = await svc.storage.from('gold-crops').download(file);
  if (error || !data) return NOT_FOUND();
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
