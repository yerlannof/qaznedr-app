import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Build query filtered by user_id (owner)
    let queryBuilder = supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply status filter if provided
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // Apply sorting and pagination
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    const deposits = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || '',
      description: row.description || '',
      type: row.type,
      mineral: row.mineral,
      region: row.region,
      city: row.city || '',
      price: row.price != null ? Number(row.price) : null,
      area: Number(row.area) || 0,
      status: row.status || 'DRAFT',
      verified: Boolean(row.verified),
      featured: Boolean(row.featured),
      views: Number(row.views) || 0,
      images: Array.isArray(row.images) ? row.images : [],
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      licenseSubtype: row.license_subtype || null,
      licenseNumber: row.license_number || null,
      licenseExpiry: row.license_expiry || null,
      explorationStage: row.exploration_stage || null,
      discoveryDate: row.discovery_date || null,
      geologicalConfidence: row.geological_confidence || null,
      estimatedReserves:
        row.estimated_reserves != null ? Number(row.estimated_reserves) : null,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
