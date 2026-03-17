import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRateLimit } from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/search/autocomplete
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await verifyRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
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

    // Sanitize query
    const sanitizedQuery = query
      .replace(/[%_]/g, '\\$&')
      .replace(/['"]/g, '')
      .trim()
      .substring(0, 100);

    const supabase = await createClient();
    let dbQuery = supabase
      .from('kazakhstan_deposits')
      .select('id, title, type, region')
      .ilike('title', `%${sanitizedQuery}%`)
      .limit(10);

    if (region) {
      dbQuery = dbQuery.eq('region', region);
    }

    if (type) {
      dbQuery = dbQuery.eq('type', type);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    const suggestions = (data || []).map((item: any) => ({
      id: item.id,
      text: item.title,
      type: item.type,
      region: item.region,
    }));

    return NextResponse.json({
      success: true,
      suggestions,
      query,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Autocomplete failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
