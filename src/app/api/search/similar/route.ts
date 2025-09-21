import { NextRequest, NextResponse } from 'next/server';
import { elasticsearchClient } from '@/lib/search/elasticsearch-client';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

// GET /api/search/similar/[id]
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await verifyRateLimit(request, {
      requests: 100,
      window: '1m',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
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

    // Check Elasticsearch health
    const isHealthy = await elasticsearchClient.healthCheck();

    if (!isHealthy) {
      // Return empty results if Elasticsearch is down
      return NextResponse.json({
        success: true,
        similar: [],
        fallback: true,
      });
    }

    // Find similar listings
    const similarListings = await elasticsearchClient.findSimilar(
      listingId,
      limit
    );

    return NextResponse.json({
      success: true,
      similar: similarListings,
      total: similarListings.length,
      listingId,
    });
  } catch (error) {
    console.error('Similar listings error:', error);

    return NextResponse.json(
      {
        error: 'Failed to find similar listings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
