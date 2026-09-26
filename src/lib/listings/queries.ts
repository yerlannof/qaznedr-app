/**
 * Server-only catalog query for the /listings page.
 *
 * Mirrors the Supabase query used by the GET handler in src/app/api/listings/route.ts:
 *   - reads from `kazakhstan_deposits`
 *   - public listings: only `status = 'ACTIVE'` are visible
 *   - same filters (query / region / mineral / type / verified / featured /
 *     price min-max / area min-max)
 *   - same sort mapping (createdAt -> created_at, default created_at desc)
 *   - `.range()` pagination, exact count
 *   - each row passed through transformDepositFromDB
 *
 * On any error it returns an empty result set — never throws, never serves mock data.
 *
 * The price filters consume `priceMin`/`priceMax` expressed in BILLIONS of tenge
 * (the value written by ListingsFilters' slider) and multiply by 1e9 before hitting
 * the `price` column — preserving the mapping the previous client page used.
 */
import { createClient } from '@/lib/supabase/server';
import { transformDepositFromDB } from '@/lib/listings/transform';
import type { KazakhstanDeposit } from '@/lib/types/listing';

const PRICE_SCALE = 1_000_000_000;

export interface ListingsResult {
  deposits: KazakhstanDeposit[];
  total: number;
  totalPages: number;
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export async function getListings(
  sp: Record<string, string | string[] | undefined>,
  page: number,
  limit = 12
): Promise<ListingsResult> {
  try {
    const supabase = await createClient();

    const query = firstString(sp.q);
    const region = firstString(sp.region);
    const mineral = firstString(sp.mineral);
    const type = firstString(sp.type);
    const verified = firstString(sp.verified);
    const featured = firstString(sp.featured);
    const priceMin = firstString(sp.priceMin);
    const priceMax = firstString(sp.priceMax);
    const minArea = firstString(sp.minArea);
    const maxArea = firstString(sp.maxArea);
    // ListingsFilters writes a single `sort` param (newest/oldest/price_desc/…).
    // Map it to (column, ascending). Falls back to newest.
    const sort = firstString(sp.sort) || 'newest';

    const safePage = page > 0 ? page : 1;
    const offset = (safePage - 1) * limit;

    let queryBuilder = supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' });

    // Public listings: only ACTIVE are visible.
    queryBuilder = queryBuilder.eq('status', 'ACTIVE');

    if (query) {
      const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
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
    if (verified === 'true') {
      queryBuilder = queryBuilder.eq('verified', true);
    }
    if (featured === 'true') {
      queryBuilder = queryBuilder.eq('featured', true);
    }
    if (priceMin) {
      const parsed = Number(priceMin) * PRICE_SCALE;
      if (Number.isFinite(parsed) && parsed > 0) {
        queryBuilder = queryBuilder.gte('price', parsed);
      }
    }
    if (priceMax) {
      const parsed = Number(priceMax) * PRICE_SCALE;
      if (Number.isFinite(parsed) && parsed > 0) {
        queryBuilder = queryBuilder.lte('price', parsed);
      }
    }
    if (minArea) {
      const parsed = Number(minArea);
      if (Number.isFinite(parsed) && parsed > 0) {
        queryBuilder = queryBuilder.gte('area', parsed);
      }
    }
    if (maxArea) {
      const parsed = Number(maxArea);
      if (Number.isFinite(parsed) && parsed > 0) {
        queryBuilder = queryBuilder.lte('area', parsed);
      }
    }

    const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
      newest: { column: 'created_at', ascending: false },
      oldest: { column: 'created_at', ascending: true },
      price_desc: { column: 'price', ascending: false },
      price_asc: { column: 'price', ascending: true },
      area_desc: { column: 'area', ascending: false },
      area_asc: { column: 'area', ascending: true },
      views_desc: { column: 'views', ascending: false },
    };
    const { column, ascending } = SORT_MAP[sort] ?? SORT_MAP.newest;
    queryBuilder = queryBuilder
      .order(column, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return { deposits: [], total: 0, totalPages: 0 };
    }

    const deposits = (data || []).map(
      transformDepositFromDB
    ) as KazakhstanDeposit[];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return { deposits, total, totalPages };
  } catch {
    return { deposits: [], total: 0, totalPages: 0 };
  }
}
