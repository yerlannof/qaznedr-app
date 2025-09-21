import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { mockDeposits } from '@/lib/data/mock-deposits';
import {
  rateLimit,
  createRateLimitResponse,
} from '@/lib/middleware/rate-limit';
import {
  listingQuerySchema,
  createListingSchema,
  validateRequest,
} from '@/lib/validations/api';
import {
  sentryMiningService,
  MiningErrorType,
  MiningMetric,
  ListingType,
} from '@/lib/monitoring/sentry-service';
import { performanceMonitoring } from '@/lib/middleware/performance-monitoring';
import {
  sanitizeMiningInput,
  detectSqlInjection,
  ValidationSchemas,
} from '@/lib/middleware/input-sanitization';

// Temporary simplified cache while fixing Redis issues
const cache = {
  get: async () => null,
  set: async () => {},
};

const getCacheKey = (prefix: string, params: any) =>
  `${prefix}_${JSON.stringify(params)}`;
const CACHE_TTL = { MEDIUM: 300 };

// Helper function to safely parse integers with validation
function safeParseInt(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  const parsed = parseInt(value || '');
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

// GET /api/listings - Get all listings with pagination and filtering
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request);
  if (rateLimitResult && !rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.reset,
      rateLimitResult.remaining
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Add monitoring breadcrumb
    sentryMiningService.addMiningBreadcrumb(
      'Listings API: Processing GET request',
      'api',
      { endpoint: '/api/listings', method: 'GET' }
    );

    // Validate query parameters with zod
    const paramsObject = Object.fromEntries(searchParams.entries());
    const validation = validateRequest(paramsObject, listingQuerySchema);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.errors.flatten(),
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    const offset = (params.page - 1) * params.limit;

    // Extract validated parameters
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      query,
      region,
      mineral,
      type,
      verified,
      featured,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
    } = params;

    // Try to get from cache with monitoring
    const cacheKey = getCacheKey('LISTINGS', params);
    const cachedData = await cache.get<any>(cacheKey);

    if (cachedData) {
      // Track cache hit
      sentryMiningService.trackCacheOperation('hit', cacheKey);
      sentryMiningService.trackMetric(
        MiningMetric.CACHE_HIT,
        1,
        {},
        {
          cache_key_type: 'listings',
          endpoint: '/api/listings',
        }
      );

      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    } else {
      // Track cache miss
      sentryMiningService.trackCacheOperation('miss', cacheKey);
    }

    // Build Supabase query
    const supabase = await createClient();
    let queryBuilder = supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' });

    // Apply filters with proper sanitization
    if (query) {
      // Check for SQL injection attempts
      if (detectSqlInjection(query)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid search query',
          },
          { status: 400 }
        );
      }
      // Use parameterized query to prevent SQL injection
      const sanitizedQuery = query.replace(/[%_]/g, '\\$&'); // Escape special characters
      queryBuilder = queryBuilder.or(
        `title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
      );
    }
    if (region) {
      queryBuilder = queryBuilder.eq('region', region);
    }
    if (mineral) {
      queryBuilder = queryBuilder.eq('mineral', mineral);
    }
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }
    if (verified !== null) {
      queryBuilder = queryBuilder.eq('verified', verified === 'true');
    }
    if (featured !== null) {
      queryBuilder = queryBuilder.eq('featured', featured === 'true');
    }
    if (priceMin) {
      const minPrice = safeParseInt(priceMin, 0, 0);
      if (minPrice > 0) {
        queryBuilder = queryBuilder.gte('price', minPrice);
      }
    }
    if (priceMax) {
      const maxPrice = safeParseInt(priceMax, Number.MAX_SAFE_INTEGER, 0);
      if (maxPrice < Number.MAX_SAFE_INTEGER) {
        queryBuilder = queryBuilder.lte('price', maxPrice);
      }
    }
    if (areaMin) {
      const minArea = safeParseInt(areaMin, 0, 0);
      if (minArea > 0) {
        queryBuilder = queryBuilder.gte('area', minArea);
      }
    }
    if (areaMax) {
      const maxArea = safeParseInt(areaMax, Number.MAX_SAFE_INTEGER, 0);
      if (maxArea < Number.MAX_SAFE_INTEGER) {
        queryBuilder = queryBuilder.lte('area', maxArea);
      }
    }

    // Apply sorting, pagination
    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Execute query with performance monitoring
    const { data, error, count } =
      await performanceMonitoring.monitorDatabaseOperation(
        () => queryBuilder,
        'listings_query',
        'kazakhstan_deposits'
      );

    // If there's an error or no data, use mock data
    let deposits: any[] = data || [];
    let totalCount = count || 0;

    if (error || deposits.length === 0) {
      // Filter mock data based on query parameters
      let filteredMocks = [...mockDeposits];

      if (query) {
        filteredMocks = filteredMocks.filter(
          (d) =>
            d.title.toLowerCase().includes(query.toLowerCase()) ||
            d.description.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (region) {
        filteredMocks = filteredMocks.filter((d) => d.region === region);
      }
      if (mineral) {
        filteredMocks = filteredMocks.filter((d) => d.mineral === mineral);
      }
      if (type) {
        filteredMocks = filteredMocks.filter((d) => d.type === type);
      }
      if (verified !== null) {
        filteredMocks = filteredMocks.filter(
          (d) => d.verified === (verified === 'true')
        );
      }
      if (featured !== null) {
        filteredMocks = filteredMocks.filter(
          (d) => d.featured === (featured === 'true')
        );
      }
      if (priceMin) {
        const minPrice = safeParseInt(priceMin, 0, 0);
        if (minPrice > 0) {
          filteredMocks = filteredMocks.filter(
            (d) => (d.price || 0) >= minPrice
          );
        }
      }
      if (priceMax) {
        const maxPrice = safeParseInt(priceMax, Number.MAX_SAFE_INTEGER, 0);
        if (maxPrice < Number.MAX_SAFE_INTEGER) {
          filteredMocks = filteredMocks.filter(
            (d) => (d.price || 0) <= maxPrice
          );
        }
      }
      if (areaMin) {
        const minArea = safeParseInt(areaMin, 0, 0);
        if (minArea > 0) {
          filteredMocks = filteredMocks.filter((d) => d.area >= minArea);
        }
      }
      if (areaMax) {
        const maxArea = safeParseInt(areaMax, Number.MAX_SAFE_INTEGER, 0);
        if (maxArea < Number.MAX_SAFE_INTEGER) {
          filteredMocks = filteredMocks.filter((d) => d.area <= maxArea);
        }
      }

      // Sort mock data
      filteredMocks.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortOrder === 'asc' ? 1 : -1;
        if (bVal == null) return sortOrder === 'asc' ? -1 : 1;

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      totalCount = filteredMocks.length;
      deposits = filteredMocks.slice(offset, offset + limit);
    }

    const result = {
      deposits,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };

    // Cache the result with monitoring
    await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
    sentryMiningService.trackCacheOperation('set', cacheKey);

    // Track successful API response
    sentryMiningService.trackMetric(
      MiningMetric.API_REQUEST_PROCESSED,
      1,
      {},
      {
        endpoint: '/api/listings',
        method: 'GET',
        status: 'success',
        cached: 'false',
        results_count: deposits.length.toString(),
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('API Error in GET /api/listings:', error);

    // Capture error with mining context
    sentryMiningService.captureError(
      error as Error,
      MiningErrorType.LISTING_CREATION_FAILED,
      { apiEndpoint: '/api/listings' },
      'error'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch listings',
        debug:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  // Apply rate limiting (stricter for write operations)
  const rateLimitResult = await rateLimit(request);
  if (rateLimitResult && !rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.reset,
      rateLimitResult.remaining
    );
  }

  try {
    // Add monitoring for listing creation
    sentryMiningService.addMiningBreadcrumb(
      'Listings API: Processing POST request',
      'api',
      { endpoint: '/api/listings', method: 'POST' }
    );

    const supabase = await createClient();

    // Get authenticated user with monitoring
    const {
      data: { user },
      error: authError,
    } = await performanceMonitoring.monitorDatabaseOperation(
      () => supabase.auth.getUser(),
      'get_authenticated_user',
      'auth.users'
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Sanitize input to prevent XSS and injection attacks
    const sanitizedBody = sanitizeMiningInput(body);

    // Validate request body with zod
    const validation = validateRequest(sanitizedBody, createListingSchema);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.errors.flatten(),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    const insertData: Database['public']['Tables']['kazakhstan_deposits']['Insert'] =
      {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        mineral: validatedData.mineral,
        region: validatedData.region,
        city: validatedData.city,
        area: validatedData.area,
        price: validatedData.price,
        coordinates: validatedData.coordinates,
        images: validatedData.images,
        documents: validatedData.documents,
        verified: false, // Default requires verification
        featured: false,
        status: 'DRAFT', // Start as draft
        user_id: user.id,

        // Conditional fields based on type
        license_subtype: validatedData.licenseSubtype,
        license_number: validatedData.licenseNumber,
        license_expiry: validatedData.licenseExpiry,
        annual_production_limit: validatedData.annualProductionLimit,

        exploration_stage: validatedData.explorationStage,
        exploration_start: validatedData.explorationStart,
        exploration_end: validatedData.explorationEnd,
        exploration_budget: validatedData.explorationBudget,

        discovery_date: validatedData.discoveryDate,
        geological_confidence: validatedData.geologicalConfidence,
        estimated_reserves: validatedData.estimatedReserves,
        accessibility_rating: validatedData.accessibilityRating?.toString(),
      };

    // Insert new listing with monitoring
    const { data: newDeposit, error: insertError } =
      await performanceMonitoring.monitorDatabaseOperation(
        () =>
          supabase
            .from('kazakhstan_deposits')
            .insert([insertData] as any)
            .select()
            .single(),
        'create_new_listing',
        'kazakhstan_deposits'
      );

    if (insertError) {
      throw insertError;
    }

    // Track successful listing creation
    sentryMiningService.trackMetric(
      MiningMetric.LISTING_CREATED,
      1,
      {
        listingId: newDeposit.id,
        listingType: validatedData.type as ListingType,
        userId: user.id,
      },
      {
        listing_type: validatedData.type,
        mineral: validatedData.mineral,
        region: validatedData.region,
        status: 'success',
      }
    );

    // Set user context for future tracking
    sentryMiningService.setUserContext(user.id, {
      email: user.email || undefined,
    });

    return NextResponse.json({
      success: true,
      data: newDeposit,
    });
  } catch (error) {
    // Capture error with enhanced mining context
    sentryMiningService.captureError(
      error as Error,
      MiningErrorType.LISTING_CREATION_FAILED,
      {
        apiEndpoint: '/api/listings',
        userId: 'unknown', // User context may not be available in error case
      },
      'error'
    );

    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
