import 'server-only';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { TEASER_COLUMNS, type LeadTeaser, type LeadType } from './types';
import { mineralHub, matchesMineral } from './minerals';

// Leads tables aren't in database.types.ts yet → cast the query builder to any
// (matches the existing codebase convention). The anon client + RLS guarantees
// only status='PUBLISHED' rows and only the allow-listed teaser columns ship out.

export interface LeadListFilters {
  region?: string;
  tier?: string;
  type?: LeadType;
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

  let minerals: string[] | undefined;
  if (f.mineral && mineralHub(f.mineral)) {
    const sourceValues = await listPublishedMinerals();
    minerals = sourceValues.filter((value) =>
      matchesMineral(value, f.mineral!)
    );
    if (!minerals.length)
      return { leads: [], total: 0, page, limit, totalPages: 0 };
  }

  let q = (supabase as any)
    .from('leads')
    .select(TEASER_COLUMNS, { count: 'exact' })
    .eq('status', 'PUBLISHED');

  if (f.region) q = q.eq('region', f.region);
  if (f.tier) q = q.eq('tier', f.tier);
  if (f.type && ['placer', 'bedrock', 'other'].includes(f.type))
    q = q.eq('type', f.type);
  if (minerals) q = q.in('mineral', minerals);
  else if (f.mineral) q = q.eq('mineral', f.mineral);
  if (f.exclusivity) q = q.eq('exclusivity', f.exclusivity);
  if (f.freeOnly) q = q.ilike('license_status', '%FREE%');

  if (!f.sort || f.sort === 'newest')
    // Showcase cards keep the delivered package order (gold first); the
    // contract forbids re-sorting by how impressive a number looks.
    q = q.order('sort_order', { ascending: true, nullsFirst: false });
  if (f.sort === 'value_desc')
    q = q.order('fair_value_max_usd_m', {
      ascending: false,
      nullsFirst: false,
    });
  else if (f.sort === 'confidence_desc')
    q = q.order('confidence', { ascending: false, nullsFirst: false });
  else q = q.order('published_at', { ascending: false, nullsFirst: false });
  if (f.sort === 'value_desc' || f.sort === 'confidence_desc')
    q = q.order('sort_order', { ascending: true, nullsFirst: false });
  // Unique tiebreaker: rows with equal sort values keep one order, so OFFSET
  // pages never overlap or skip (e.g. a batch published at the same time).
  q = q.order('code', { ascending: true });

  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    throw new Error('Unable to load areas');
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

/** Read only public commodity labels, with stable paging; never truncate a hub. */
async function listPublishedMinerals(): Promise<string[]> {
  const supabase = await createClient();
  const values = new Set<string>();
  for (let offset = 0; offset < 20000; offset += 1000) {
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('mineral')
      .eq('status', 'PUBLISHED')
      .order('code', { ascending: true })
      .range(offset, offset + 999);
    if (error) throw new Error('Unable to load areas');
    for (const row of data ?? []) if (row.mineral) values.add(row.mineral);
    if (!data || data.length < 1000) return Array.from(values);
  }
  throw new Error('Unable to load complete mineral list');
}

/**
 * A showcase card that was live and then withdrawn gets a neutral notice on
 * its old address (geobase contract): no reason, no "occupied". Codes that
 * were never published stay a plain 404. ARCHIVED rows are invisible to anon,
 * so this server-only check reads with the service role.
 */
export async function isWithdrawnShowcase(code: string): Promise<boolean> {
  if (!/^QN-\d{2,}$/.test(code)) return false;
  const supabase = await createServiceClient();
  const { data, error } = await (supabase as any)
    .from('leads')
    .select('code')
    .eq('code', code)
    .eq('status', 'ARCHIVED')
    .not('published_at', 'is', null)
    .not('showcase', 'is', null)
    .maybeSingle();
  return !error && !!data;
}
