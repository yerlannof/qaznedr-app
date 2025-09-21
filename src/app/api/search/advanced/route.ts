import { NextRequest, NextResponse } from 'next/server';
import {
  elasticsearchClient,
  SearchParams,
} from '@/lib/search/elasticsearch-client';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

// Request validation schema
const searchRequestSchema = z.object({
  query: z.string().optional(),
  filters: z
    .object({
      type: z.array(z.string()).optional(),
      region: z.array(z.string()).optional(),
      minerals: z.array(z.string()).optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      areaMin: z.number().optional(),
      areaMax: z.number().optional(),
      licenseStatus: z.array(z.string()).optional(),
      explorationStage: z.array(z.string()).optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z.enum(['price', 'area', 'created_at', 'reserves', '_score']),
      order: z.enum(['asc', 'desc']),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number().min(1).default(1),
      size: z.number().min(1).max(100).default(20),
    })
    .optional(),
  geoFilter: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.string().regex(/^\d+(?:m|km|mi)$/),
    })
    .optional(),
  includeAggregations: z.boolean().optional(),
});

// GET /api/search/advanced
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: SearchParams = {
      query: searchParams.get('q') || undefined,
      filters: {
        type: searchParams.getAll('type'),
        region: searchParams.getAll('region'),
        minerals: searchParams.getAll('mineral'),
        priceMin: searchParams.get('priceMin')
          ? Number(searchParams.get('priceMin'))
          : undefined,
        priceMax: searchParams.get('priceMax')
          ? Number(searchParams.get('priceMax'))
          : undefined,
        areaMin: searchParams.get('areaMin')
          ? Number(searchParams.get('areaMin'))
          : undefined,
        areaMax: searchParams.get('areaMax')
          ? Number(searchParams.get('areaMax'))
          : undefined,
        licenseStatus: searchParams.getAll('status'),
        explorationStage: searchParams.getAll('stage'),
      },
      sort: searchParams.get('sortBy')
        ? {
            field: searchParams.get('sortBy') as any,
            order: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
          }
        : undefined,
      pagination: {
        page: Number(searchParams.get('page') || 1),
        size: Number(searchParams.get('size') || 20),
      },
      geoFilter:
        searchParams.get('lat') && searchParams.get('lng')
          ? {
              lat: Number(searchParams.get('lat')),
              lng: Number(searchParams.get('lng')),
              radius: searchParams.get('radius') || '50km',
            }
          : undefined,
      includeAggregations: searchParams.get('facets') === 'true',
    };

    // Check Elasticsearch health
    const isHealthy = await elasticsearchClient.healthCheck();

    if (!isHealthy) {
      // Fallback to Supabase search
      console.log('Elasticsearch unhealthy, falling back to Supabase');
      return await fallbackToSupabaseSearch(params);
    }

    // Perform search
    const results = await elasticsearchClient.search(params);

    // Track search analytics
    await trackSearchAnalytics(params.query || '', results.total);

    return NextResponse.json({
      success: true,
      data: results.results,
      total: results.total,
      page: params.pagination?.page || 1,
      size: params.pagination?.size || 20,
      aggregations: results.aggregations,
    });
  } catch (error) {
    console.error('Search error:', error);

    // Fallback to Supabase on error
    if (error instanceof Error && error.message.includes('connect')) {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      return await fallbackToSupabaseSearch(searchParams as any);
    }

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/search/advanced
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await verifyRateLimit(request, {
      requests: 50,
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

    // Parse and validate request body
    const body = await request.json();
    const validatedParams = searchRequestSchema.parse(body);

    // Check Elasticsearch health
    const isHealthy = await elasticsearchClient.healthCheck();

    if (!isHealthy) {
      // Fallback to Supabase search
      console.log('Elasticsearch unhealthy, falling back to Supabase');
      return await fallbackToSupabaseSearch(validatedParams as SearchParams);
    }

    // Perform search
    const results = await elasticsearchClient.search(
      validatedParams as SearchParams
    );

    // Track search analytics
    await trackSearchAnalytics(validatedParams.query || '', results.total);

    return NextResponse.json({
      success: true,
      data: results.results,
      total: results.total,
      page: validatedParams.pagination?.page || 1,
      size: validatedParams.pagination?.size || 20,
      aggregations: results.aggregations,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Fallback to Supabase when Elasticsearch is unavailable
async function fallbackToSupabaseSearch(params: SearchParams) {
  try {
    const supabase = createClient();
    let query = supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' });

    // Apply filters - SECURE: Use proper text search to prevent SQL injection
    if (params.query) {
      // Sanitize query string to prevent SQL injection
      const sanitizedQuery = params.query
        .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
        .replace(/['"]/g, '') // Remove quotes
        .trim()
        .substring(0, 100); // Limit length

      if (sanitizedQuery.length >= 2) {
        // Use Supabase's full-text search which is SQL injection safe
        query = query.textSearch('fts', sanitizedQuery, {
          type: 'websearch',
          config: 'english',
        });
      }
    }

    if (params.filters?.type?.length) {
      query = query.in('type', params.filters.type);
    }

    if (params.filters?.region?.length) {
      query = query.in('region', params.filters.region);
    }

    if (params.filters?.minerals?.length) {
      query = query.contains('minerals', params.filters.minerals);
    }

    if (params.filters?.priceMin !== undefined) {
      query = query.gte('price', params.filters.priceMin);
    }

    if (params.filters?.priceMax !== undefined) {
      query = query.lte('price', params.filters.priceMax);
    }

    if (params.filters?.areaMin !== undefined) {
      query = query.gte('area_hectares', params.filters.areaMin);
    }

    if (params.filters?.areaMax !== undefined) {
      query = query.lte('area_hectares', params.filters.areaMax);
    }

    if (params.filters?.licenseStatus?.length) {
      query = query.in('status', params.filters.licenseStatus);
    }

    if (params.filters?.explorationStage?.length) {
      query = query.in('exploration_stage', params.filters.explorationStage);
    }

    // Apply sorting
    if (params.sort) {
      const column =
        params.sort.field === '_score' ? 'created_at' : params.sort.field;
      query = query.order(column, { ascending: params.sort.order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = params.pagination?.page || 1;
    const size = params.pagination?.size || 20;
    const from = (page - 1) * size;
    query = query.range(from, from + size - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      size,
      fallback: true, // Indicate this is a fallback response
    });
  } catch (error) {
    console.error('Supabase search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Track search analytics
async function trackSearchAnalytics(query: string, resultCount: number) {
  try {
    const supabase = createClient();

    await supabase.from('search_analytics').insert({
      query,
      result_count: resultCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking search analytics:', error);
    // Don't fail the request if analytics tracking fails
  }
}
