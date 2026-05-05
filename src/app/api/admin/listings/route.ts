import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin, forbidden } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/listings?status=PENDING_MODERATION
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return forbidden();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING_MODERATION';

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    let queryBuilder = (serviceClient as any)
      .from('kazakhstan_deposits')
      .select(
        `
        id,
        title,
        description,
        type,
        mineral,
        region,
        price,
        area,
        status,
        verified,
        featured,
        views,
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
      .order('created_at', { ascending: false });

    // status=ALL returns everything (admin overview)
    if (status !== 'ALL') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data: listings, error } = await queryBuilder;

    if (error) {
      // If the join fails, fall back to fetching listings without join
      let fallbackQuery = (serviceClient as any)
        .from('kazakhstan_deposits')
        .select('*')
        .order('created_at', { ascending: false });
      if (status !== 'ALL') fallbackQuery = fallbackQuery.eq('status', status);
      const { data: fallbackListings, error: fallbackError } =
        await fallbackQuery;

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
          owner_name: 'Unknown',
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
      price: listing.price,
      area: listing.area,
      status: listing.status,
      verified: listing.verified,
      featured: listing.featured,
      views: listing.views,
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

// POST /api/admin/listings — admin creates a listing (auto-published, no moderation)
// Body matches createListingSchema; admin can also pass user_id to assign ownership
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return forbidden();

    const body = await request.json();
    const ownerId = (body?.user_id as string | undefined) ?? admin.userId;

    const supabase = await createServiceClient();
    const insertData = {
      title: body.title,
      description: body.description ?? '',
      type: body.type,
      mineral: body.mineral,
      region: body.region,
      city: body.city ?? '',
      area: body.area ?? 0,
      price: body.price ?? null,
      coordinates: body.coordinates ?? { lat: 0, lng: 0 },
      images: body.images ?? [],
      documents: body.documents ?? [],
      verified: body.verified ?? false,
      featured: body.featured ?? false,
      status: body.status ?? 'ACTIVE',
      user_id: ownerId,
      license_subtype: body.licenseSubtype ?? null,
      license_number: body.licenseNumber ?? null,
      license_expiry: body.licenseExpiry ?? null,
      exploration_stage: body.explorationStage ?? null,
      discovery_date: body.discoveryDate ?? null,
      geological_confidence: body.geologicalConfidence ?? null,
      estimated_reserves: body.estimatedReserves
        ? Number(body.estimatedReserves)
        : null,
    };

    const { data, error } = await (supabase as any)
      .from('kazakhstan_deposits')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Insert failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
