import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { TEASER_COLUMNS, type LeadTeaser } from './types';

// Leads tables aren't in database.types.ts yet → cast the query builder to any
// (matches the existing codebase convention). The anon client + RLS guarantees
// only status='PUBLISHED' rows and only the allow-listed teaser columns ship out.

export interface LeadListFilters {
  region?: string;
  tier?: string;
  mineral?: string;
  exclusivity?: string;
  freeOnly?: boolean;
  available?: boolean; // exclude SOLD
  sort?: 'newest' | 'value_desc' | 'confidence_desc';
  page?: number;
  limit?: number;
}

export interface LeadListResult {
  leads: LeadTeaser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listPublishedLeads(
  f: LeadListFilters = {}
): Promise<LeadListResult> {
  const supabase = await createClient();
  const limit = Math.min(f.limit ?? 24, 50); // hard cap — no bulk dump
  const page = Math.max(f.page ?? 1, 1);
  const offset = (page - 1) * limit;

  let q = (supabase as any)
    .from('leads')
    .select(TEASER_COLUMNS, { count: 'exact' })
    .eq('status', 'PUBLISHED');

  if (f.region) q = q.eq('region', f.region);
  if (f.tier) q = q.eq('tier', f.tier);
  if (f.mineral) q = q.eq('mineral', f.mineral);
  if (f.exclusivity) q = q.eq('exclusivity', f.exclusivity);
  if (f.freeOnly) q = q.ilike('license_status', '%FREE%');

  if (f.sort === 'value_desc')
    q = q.order('fair_value_max_usd_m', {
      ascending: false,
      nullsFirst: false,
    });
  else if (f.sort === 'confidence_desc')
    q = q.order('confidence', { ascending: false, nullsFirst: false });
  else q = q.order('published_at', { ascending: false, nullsFirst: false });

  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error('listPublishedLeads error:', error.message);
    return { leads: [], total: 0, page, limit, totalPages: 0 };
  }
  return {
    leads: (data ?? []) as LeadTeaser[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getPublishedLeadByCode(
  code: string
): Promise<LeadTeaser | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('leads')
    .select(TEASER_COLUMNS)
    .eq('code', code)
    .eq('status', 'PUBLISHED')
    .maybeSingle();
  if (error || !data) return null;
  return data as LeadTeaser;
}

/** Distinct regions present among published leads (for filter dropdown). */
export async function listLeadRegions(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from('leads')
    .select('region')
    .eq('status', 'PUBLISHED');
  const set = new Set<string>();
  for (const r of (data ?? []) as { region: string | null }[]) {
    if (r.region) set.add(r.region);
  }
  return Array.from(set).sort();
}
