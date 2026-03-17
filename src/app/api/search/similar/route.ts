import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

// GET /api/search/similar
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await verifyRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get listing ID from query params
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('id');
    const limit = Number(searchParams.get('limit') || 5);

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, fetch the source listing to find similar ones
    const { data: sourceListing, error: sourceError } = await supabase
      .from('kazakhstan_deposits')
      .select('id, type, region, minerals')
      .eq('id', listingId)
      .single();

    if (sourceError || !sourceListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const source = sourceListing as any;

    // Find similar listings by matching type and region, excluding the source
    const { data: similarListings, error: similarError } = await supabase
      .from('kazakhstan_deposits')
      .select('*')
      .neq('id', listingId)
      .or(`type.eq.${source.type},region.eq.${source.region}`)
      .limit(limit);

    if (similarError) {
      throw similarError;
    }

    return NextResponse.json({
      success: true,
      similar: similarListings || [],
      total: (similarListings || []).length,
      listingId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to find similar listings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
