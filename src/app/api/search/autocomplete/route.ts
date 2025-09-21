import { NextRequest, NextResponse } from 'next/server';
import { elasticsearchClient } from '@/lib/search/elasticsearch-client';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

// GET /api/search/autocomplete
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await verifyRateLimit(request, {
      requests: 200,
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const region = searchParams.get('region');
    const type = searchParams.get('type');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check Elasticsearch health
    const isHealthy = await elasticsearchClient.healthCheck();

    if (!isHealthy) {
      // Return empty suggestions if Elasticsearch is down
      return NextResponse.json({
        success: true,
        suggestions: [],
        fallback: true,
      });
    }

    // Get autocomplete suggestions
    const suggestions = await elasticsearchClient.suggest(query, {
      region: region || undefined,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      suggestions,
      query,
    });
  } catch (error) {
    console.error('Autocomplete error:', error);

    return NextResponse.json(
      {
        error: 'Autocomplete failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
