import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/services - Fetch services with optional filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const serviceType = searchParams.get('service_type');
    const region = searchParams.get('region');
    const query = searchParams.get('query');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '12', 10))
    );
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let queryBuilder = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    if (serviceType) {
      queryBuilder = queryBuilder.eq('service_type', serviceType);
    }

    if (region) {
      queryBuilder = queryBuilder.eq('region', region);
    }

    if (query) {
      const sanitized = query.replace(/[%_]/g, '\\$&');
      queryBuilder = queryBuilder.or(
        `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%,provider_name.ilike.%${sanitized}%`
      );
    }

    queryBuilder = queryBuilder
      .order('verified', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        services: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service (requires authentication)
export async function POST(request: NextRequest) {
  try {
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

    const {
      title,
      description,
      service_type,
      provider_name,
      provider_phone,
      provider_email,
      region,
      city,
      price_range,
      website,
    } = body;

    if (!title || !description || !service_type || !provider_name || !region) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: title, description, service_type, provider_name, region',
        },
        { status: 400 }
      );
    }

    const validTypes = [
      'drilling',
      'consulting',
      'audit',
      'legal',
      'lab',
      'reserve_estimation',
      'equipment',
      'other',
    ];

    if (!validTypes.includes(service_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid service_type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const insertData = {
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 2000),
      service_type,
      provider_id: user.id,
      provider_name: String(provider_name).slice(0, 200),
      provider_phone: provider_phone
        ? String(provider_phone).slice(0, 30)
        : null,
      provider_email: provider_email
        ? String(provider_email).slice(0, 200)
        : user.email,
      region: String(region).slice(0, 100),
      city: city ? String(city).slice(0, 100) : null,
      price_range: price_range ? String(price_range).slice(0, 100) : null,
      website: website ? String(website).slice(0, 500) : null,
      status: 'active',
      verified: false,
    };

    const { data, error } = await (supabase.from('services') as any)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
