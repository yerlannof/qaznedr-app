import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/listings?status=PENDING_MODERATION
export async function GET(request: NextRequest) {
  try {
    // Check that a session exists (basic admin check)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING_MODERATION';

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    const { data: listings, error } = await serviceClient
      .from('kazakhstan_deposits')
      .select(
        `
        id,
        title,
        description,
        type,
        mineral,
        region,
        status,
        created_at,
        user_id,
        profiles:user_id (
          id,
          full_name,
          email,
          is_trusted_seller,
          listings_moderated_count
        )
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      // If the join fails (profiles table might not have the relationship),
      // fall back to fetching listings without join
      const { data: fallbackListings, error: fallbackError } =
        await serviceClient
          .from('kazakhstan_deposits')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false });

      if (fallbackError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch listings' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: (fallbackListings || []).map((listing: any) => ({
          ...listing,
          owner_name: listing.owner_name || 'Unknown',
        })),
      });
    }

    // Transform the data to flatten owner info
    const transformed = (listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      type: listing.type,
      mineral: listing.mineral,
      region: listing.region,
      status: listing.status,
      created_at: listing.created_at,
      user_id: listing.user_id,
      owner_name:
        listing.profiles?.full_name || listing.profiles?.email || 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
