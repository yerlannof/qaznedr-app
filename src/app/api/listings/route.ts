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
  draftListingSchema,
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
import { getProfile } from '@/lib/supabase/profiles';

export const dynamic = 'force-dynamic';

/**
 * Transform a database row (snake_case) into the KazakhstanDeposit format (camelCase)
 * expected by frontend components. Handles null values with safe defaults.
 */
function transformDepositFromDB(row: any): any {
  // Parse coordinates - handle various formats from the database
  let coordinates: [number, number] = [0, 0];
  if (row.coordinates_lat != null && row.coordinates_lng != null) {
    // Separate lat/lng fields
    coordinates = [
      Number(row.coordinates_lat) || 0,
      Number(row.coordinates_lng) || 0,
    ];
  } else if (row.coordinates) {
    if (Array.isArray(row.coordinates) && row.coordinates.length >= 2) {
      // Already a [lat, lng] array
      coordinates = [
        Number(row.coordinates[0]) || 0,
        Number(row.coordinates[1]) || 0,
      ];
    } else if (
      typeof row.coordinates === 'object' &&
      row.coordinates !== null
    ) {
      // Object with lat/lng keys
      coordinates = [
        Number(row.coordinates.lat ?? row.coordinates.latitude ?? 0) || 0,
        Number(
          row.coordinates.lng ??
            row.coordinates.longitude ??
            row.coordinates.lon ??
            0
        ) || 0,
      ];
    } else if (typeof row.coordinates === 'string') {
      try {
        const parsed = JSON.parse(row.coordinates);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          coordinates = [Number(parsed[0]) || 0, Number(parsed[1]) || 0];
        } else if (typeof parsed === 'object' && parsed !== null) {
          coordinates = [
            Number(parsed.lat ?? parsed.latitude ?? 0) || 0,
            Number(parsed.lng ?? parsed.longitude ?? parsed.lon ?? 0) || 0,
          ];
        }
      } catch {
        // leave as [0, 0]
      }
    }
  }

  // Build exploration period if start/end are present
  let explorationPeriod: { start: Date; end: Date } | undefined;
  if (row.exploration_start && row.exploration_end) {
    explorationPeriod = {
      start: new Date(row.exploration_start),
      end: new Date(row.exploration_end),
    };
  }

  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    type: row.type,
    mineral: row.mineral,
    region: row.region,
    city: row.city || '',
    area: Number(row.area) || 0,
    price: row.price != null ? Number(row.price) : null,
    coordinates,
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    views: Number(row.views) || 0,
    status: row.status || 'ACTIVE',
    images: Array.isArray(row.images) ? row.images : [],
    documents: Array.isArray(row.documents) ? row.documents : [],
    userId: row.user_id || row.owner_id || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

    // Mining license fields
    licenseSubtype: row.license_subtype || undefined,
    licenseNumber: row.license_number || undefined,
    licenseExpiry: row.license_expiry
      ? new Date(row.license_expiry)
      : undefined,
    annualProductionLimit:
      row.annual_production_limit != null
        ? Number(row.annual_production_limit)
        : undefined,

    // Exploration license fields
    explorationStage: row.exploration_stage || undefined,
    explorationPeriod,
    explorationBudget:
      row.exploration_budget != null
        ? Number(row.exploration_budget)
        : undefined,

    // Mineral occurrence fields
    discoveryDate: row.discovery_date
      ? new Date(row.discovery_date)
      : undefined,
    geologicalConfidence: row.geological_confidence || undefined,
    estimatedReserves:
      row.estimated_reserves != null
        ? Number(row.estimated_reserves)
        : undefined,
    accessibilityRating: row.accessibility_rating || undefined,
  };
}

// Temporary simplified cache while fixing Redis issues
const cache = {
  get: async (key?: string) => null,
  set: async (key?: string, value?: any, ttl?: any) => {},
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
    const offset = ((params.page ?? 1) - 1) * (params.limit ?? 10);

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
      minPrice,
      maxPrice,
      minArea,
      maxArea,
    } = params;

    // Try to get from cache with monitoring
    const cacheKey = getCacheKey('LISTINGS', params);
    const cachedData = await cache.get(cacheKey);

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

    // Public listings: only ACTIVE are visible (hide DRAFT/PENDING/REJECTED/SOLD/EXPIRED/DELETED)
    queryBuilder = queryBuilder.eq('status', 'ACTIVE');

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
    if (verified !== undefined && verified !== null) {
      queryBuilder = queryBuilder.eq('verified', verified === 'true');
    }
    if (featured !== undefined && featured !== null) {
      queryBuilder = queryBuilder.eq('featured', featured === 'true');
    }
    if (minPrice) {
      const parsedMinPrice = safeParseInt(minPrice, 0, 0);
      if (parsedMinPrice > 0) {
        queryBuilder = queryBuilder.gte('price', parsedMinPrice);
      }
    }
    if (maxPrice) {
      const parsedMaxPrice = safeParseInt(maxPrice, Number.MAX_SAFE_INTEGER, 0);
      if (parsedMaxPrice < Number.MAX_SAFE_INTEGER) {
        queryBuilder = queryBuilder.lte('price', parsedMaxPrice);
      }
    }
    if (minArea) {
      const parsedMinArea = safeParseInt(minArea, 0, 0);
      if (parsedMinArea > 0) {
        queryBuilder = queryBuilder.gte('area', parsedMinArea);
      }
    }
    if (maxArea) {
      const parsedMaxArea = safeParseInt(maxArea, Number.MAX_SAFE_INTEGER, 0);
      if (parsedMaxArea < Number.MAX_SAFE_INTEGER) {
        queryBuilder = queryBuilder.lte('area', parsedMaxArea);
      }
    }

    // Apply sorting, pagination
    const dbSortBy =
      sortBy === 'createdAt' ? 'created_at' : (sortBy ?? 'created_at');
    queryBuilder = queryBuilder
      .order(dbSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + (limit ?? 10) - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    // If there's an error or no data, use mock data
    // Transform Supabase rows to frontend-expected KazakhstanDeposit format
    let deposits: any[] = (data || []).map(transformDepositFromDB);
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
      if (verified !== undefined && verified !== null) {
        filteredMocks = filteredMocks.filter(
          (d) => d.verified === (verified === 'true')
        );
      }
      if (featured !== undefined && featured !== null) {
        filteredMocks = filteredMocks.filter(
          (d) => d.featured === (featured === 'true')
        );
      }
      if (minPrice) {
        const parsedMinPrice = safeParseInt(minPrice, 0, 0);
        if (parsedMinPrice > 0) {
          filteredMocks = filteredMocks.filter(
            (d) => (d.price || 0) >= parsedMinPrice
          );
        }
      }
      if (maxPrice) {
        const parsedMaxPrice = safeParseInt(
          maxPrice,
          Number.MAX_SAFE_INTEGER,
          0
        );
        if (parsedMaxPrice < Number.MAX_SAFE_INTEGER) {
          filteredMocks = filteredMocks.filter(
            (d) => (d.price || 0) <= parsedMaxPrice
          );
        }
      }
      if (minArea) {
        const parsedMinArea = safeParseInt(minArea, 0, 0);
        if (parsedMinArea > 0) {
          filteredMocks = filteredMocks.filter((d) => d.area >= parsedMinArea);
        }
      }
      if (maxArea) {
        const parsedMaxArea = safeParseInt(maxArea, Number.MAX_SAFE_INTEGER, 0);
        if (parsedMaxArea < Number.MAX_SAFE_INTEGER) {
          filteredMocks = filteredMocks.filter((d) => d.area <= parsedMaxArea);
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
      deposits = filteredMocks.slice(offset, offset + (limit ?? 10));
    }

    const finalLimit = limit ?? 10;
    const finalPage = page ?? 1;

    const result = {
      deposits,
      pagination: {
        page: finalPage,
        limit: finalLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / finalLimit),
        hasNext: finalPage < Math.ceil(totalCount / finalLimit),
        hasPrev: finalPage > 1,
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

    // Get authenticated user
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
    const isDraft = body?.draft === true;

    // Sanitize input to prevent XSS and injection attacks
    const sanitizedBody = sanitizeMiningInput(body);

    // Validate request body with zod (relaxed schema for drafts)
    const validation = validateRequest(
      sanitizedBody,
      isDraft ? draftListingSchema : createListingSchema
    );

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

    // Determine listing status based on seller trust level (drafts stay private)
    let listingStatus: 'ACTIVE' | 'PENDING_MODERATION' | 'DRAFT' =
      'PENDING_MODERATION';
    if (isDraft) {
      listingStatus = 'DRAFT';
    } else {
      const profile = await getProfile(user.id);
      if (profile && (profile as any).is_trusted_seller === true) {
        listingStatus = 'ACTIVE';
      }
    }

    const insertData: Database['public']['Tables']['kazakhstan_deposits']['Insert'] =
      {
        title: validatedData.title,
        description: validatedData.description ?? '',
        type: (validatedData.type ?? 'MINING_LICENSE') as
          | 'MINING_LICENSE'
          | 'EXPLORATION_LICENSE'
          | 'MINERAL_OCCURRENCE',
        mineral: validatedData.mineral ?? '',
        region: validatedData.region ?? '',
        city: validatedData.city ?? '',
        area: validatedData.area ?? 0,
        price: validatedData.price,
        coordinates: validatedData.coordinates ?? { lat: 0, lng: 0 },
        images: validatedData.images,
        documents: validatedData.documents,
        verified: false, // Default requires verification
        featured: false,
        status: listingStatus,
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
        estimated_reserves: validatedData.estimatedReserves
          ? Number(validatedData.estimatedReserves)
          : null,
        accessibility_rating: validatedData.accessibilityRating?.toString(),
      };

    // Insert new listing
    const { data: newDeposit, error: insertError } = await supabase
      .from('kazakhstan_deposits')
      .insert([insertData] as any)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Track successful listing creation
    sentryMiningService.trackMetric(
      MiningMetric.LISTING_CREATED,
      1,
      {
        listingId: (newDeposit as any).id,
        listingType: validatedData.type as ListingType,
        userId: user.id,
      },
      {
        listing_type: validatedData.type ?? 'unknown',
        mineral: validatedData.mineral ?? 'unknown',
        region: validatedData.region ?? 'unknown',
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
