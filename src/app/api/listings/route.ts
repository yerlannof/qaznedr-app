import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

// GET /api/listings - Get all listings with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Build query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const query = searchParams.get('query');
    const region = searchParams.get('region');
    const mineral = searchParams.get('mineral');
    const type = searchParams.get('type');
    const verified = searchParams.get('verified');
    const featured = searchParams.get('featured');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const areaMin = searchParams.get('areaMin');
    const areaMax = searchParams.get('areaMax');

    // Build Supabase query
    let queryBuilder = supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
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
      queryBuilder = queryBuilder.gte('price', parseInt(priceMin));
    }
    if (priceMax) {
      queryBuilder = queryBuilder.lte('price', parseInt(priceMax));
    }
    if (areaMin) {
      queryBuilder = queryBuilder.gte('area', parseInt(areaMin));
    }
    if (areaMax) {
      queryBuilder = queryBuilder.lte('area', parseInt(areaMax));
    }

    // Apply sorting, pagination
    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    const result = {
      deposits: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    const requiredFields = [
      'title',
      'description',
      'type',
      'mineral',
      'region',
      'city',
      'area',
      'coordinates',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    const insertData: Database['public']['Tables']['kazakhstan_deposits']['Insert'] =
      {
        title: body.title,
        description: body.description,
        type: body.type,
        mineral: body.mineral,
        region: body.region,
        city: body.city,
        area: parseFloat(body.area),
        price: body.price ? parseFloat(body.price) : null,
        coordinates: body.coordinates,
        images: body.images || [],
        documents: body.documents || [],
        verified: false, // Default requires verification
        featured: false,
        status: 'DRAFT', // Start as draft
        user_id: user.id,

        // Conditional fields based on type
        license_subtype: body.licenseSubtype,
        license_number: body.licenseNumber,
        license_expiry: body.licenseExpiry || null,
        annual_production_limit: body.annualProductionLimit
          ? parseFloat(body.annualProductionLimit)
          : null,

        exploration_stage: body.explorationStage,
        exploration_start: body.explorationStart || null,
        exploration_end: body.explorationEnd || null,
        exploration_budget: body.explorationBudget
          ? parseFloat(body.explorationBudget)
          : null,

        discovery_date: body.discoveryDate || null,
        geological_confidence: body.geologicalConfidence,
        estimated_reserves: body.estimatedReserves
          ? parseFloat(body.estimatedReserves)
          : null,
        accessibility_rating: body.accessibilityRating,
      };

    const { data: newDeposit, error: insertError } = await supabase
      .from('kazakhstan_deposits')
      .insert([insertData] as any)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: newDeposit,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
