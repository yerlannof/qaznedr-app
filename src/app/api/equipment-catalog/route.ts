import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { parseEquipmentSearchQuery } from '@/lib/equipment-listings/search';
import { searchEquipmentCatalog } from '@/lib/equipment-listings/catalog-repository';

export const dynamic = 'force-dynamic';
const respond = (body: unknown, status: number) =>
  NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

async function search(request: NextRequest) {
  let filters;
  try {
    if (request.nextUrl.search.length > 2048)
      throw new Error('Query too large');
    filters = parseEquipmentSearchQuery(request.nextUrl.searchParams);
  } catch {
    return respond({ success: false, error: 'Invalid search filters' }, 400);
  }
  try {
    return respond(
      { success: true, data: await searchEquipmentCatalog(filters) },
      200
    );
  } catch {
    return respond(
      { success: false, error: 'Equipment catalogue unavailable' },
      503
    );
  }
}

export async function GET(request: NextRequest) {
  // Opening owner operations must not accidentally publish the catalogue.
  if (
    process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true' ||
    process.env.EQUIPMENT_CATALOG_ENABLED !== 'true'
  )
    return respond({ success: false, error: 'Not found' }, 404);
  return withRateLimit(search, 'search')(request);
}
