import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const supabase = await createClient();

    const { data: views, error } = (await (supabase as any)
      .from('contact_views')
      .select('id, listing_id, seller_id, created_at')
      .eq('viewer_id', userId)
      .not('listing_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)) as {
      data: Array<{
        id: string;
        listing_id: string;
        seller_id: string | null;
        created_at: string;
      }> | null;
      error: any;
    };

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!views || views.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const listingIds = Array.from(
      new Set(views.map((v) => v.listing_id).filter(Boolean))
    );

    const { data: listings } = (await (supabase as any)
      .from('kazakhstan_deposits')
      .select(
        'id, title, type, mineral, region, city, price, area, status, created_at, images'
      )
      .in('id', listingIds)) as {
      data: Array<{
        id: string;
        title: string;
        type: string;
        mineral: string;
        region: string;
        city: string | null;
        price: number | null;
        area: number;
        status: string;
        created_at: string;
        images: string[] | null;
      }> | null;
    };

    const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));

    const data = views
      .map((view) => {
        const listing = listingMap.get(view.listing_id);
        if (!listing) return null;
        return {
          interestId: view.id,
          interestedAt: view.created_at,
          listing,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
