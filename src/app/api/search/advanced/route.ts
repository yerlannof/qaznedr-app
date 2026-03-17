import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';

// Search params type
interface SearchParams {
  query?: string;
  filters?: {
    type?: string[];
    region?: string[];
    minerals?: string[];
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    licenseStatus?: string[];
    explorationStage?: string[];
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    size: number;
  };
  geoFilter?: {
    lat: number;
    lng: number;
    radius: string;
  };
  includeAggregations?: boolean;
}

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
    const rateLimitResult = await verifyRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
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
            field: searchParams.get('sortBy') as string,
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

    return await supabaseSearch(params);
  } catch (error) {
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
    const rateLimitResult = await verifyRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedParams = searchRequestSchema.parse(body);

    return await supabaseSearch(validatedParams as SearchParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
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

// Primary search via Supabase
async function supabaseSearch(params: SearchParams) {
  try {
    const supabase = await createClient();
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
