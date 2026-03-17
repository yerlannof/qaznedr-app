import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/listings/[id]/moderate
// Body: { action: 'approve' | 'reject' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "approve" or "reject".',
        },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Get the listing first to find the owner
    const { data: listingData, error: fetchError } = await serviceClient
      .from('kazakhstan_deposits')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !listingData) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Cast to any to work around strict Supabase generated types
    const listing = listingData as any;
    const newStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED';

    // Update the listing status
    const { error: updateError } = await (
      serviceClient.from('kazakhstan_deposits') as any
    )
      .update({ status: newStatus })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update listing status' },
        { status: 500 }
      );
    }

    // If approving, update the seller's profile
    if (action === 'approve' && listing.user_id) {
      // Get current profile data
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('listings_moderated_count, is_trusted_seller')
        .eq('id', listing.user_id)
        .single();

      const currentCount = (profile as any)?.listings_moderated_count || 0;
      const newCount = currentCount + 1;

      const profileUpdate: Record<string, any> = {
        listings_moderated_count: newCount,
      };

      // If the seller now has 2 or more approved listings, mark as trusted
      if (newCount >= 2) {
        profileUpdate.is_trusted_seller = true;
      }

      await (serviceClient.from('profiles') as any)
        .update(profileUpdate)
        .eq('id', listing.user_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        status: newStatus,
        action,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
