import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { listing_id, seller_id } = await request.json();

  const supabase = await createClient();

  // Insert contact view
  await (supabase as any).from('contact_views').insert([
    {
      viewer_id: userId,
      listing_id: listing_id || null,
      seller_id: seller_id || null,
    },
  ]);

  // Increment counter on profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('contacts_viewed_count')
    .eq('id', userId)
    .single();

  if (profile) {
    await (supabase as any)
      .from('profiles')
      .update({
        contacts_viewed_count: (profile.contacts_viewed_count || 0) + 1,
      })
      .eq('id', userId);
  }

  return NextResponse.json({ success: true });
}
