import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const country = searchParams.get('country') || '';
    const verifiedOnly = searchParams.get('verified') === 'true';
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

    const supabase = await createClient();

    let query = (supabase as any)
      .from('profiles')
      .select(
        'id, full_name, company_name, country, city, description, avatar_url, is_verified, website, service_types, created_at'
      )
      .eq('profile_type', 'investor')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }
    if (country) {
      query = query.eq('country', country);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let investors = (data ?? []) as Array<{
      id: string;
      full_name: string;
      company_name: string | null;
      country: string | null;
      city: string | null;
      description: string | null;
      avatar_url: string | null;
      is_verified: boolean | null;
      website: string | null;
      service_types: string[] | null;
      created_at: string | null;
    }>;

    if (search) {
      investors = investors.filter((inv) => {
        const haystack = [
          inv.full_name,
          inv.company_name,
          inv.description,
          inv.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    return NextResponse.json({ success: true, data: investors });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
