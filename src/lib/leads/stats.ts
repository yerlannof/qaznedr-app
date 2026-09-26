import { leadRegionName } from '@/lib/seo/lead-metadata';

/** /api/leads caps `limit` at 50. */
export const LEADS_PAGE_SIZE = 50;
const MAX_PAGES = 20;

export interface LeadsPage {
  total: number;
  leads: { region?: string | null }[];
}

/** One /api/leads page. Throws on any error response — the rate limiter's
 * 429 and a DB failure both come back as JSON, not as a network error. */
export async function fetchLeadsPage(
  page: number,
  fetcher: typeof fetch = fetch
): Promise<LeadsPage> {
  const r = await fetcher(`/api/leads?limit=${LEADS_PAGE_SIZE}&page=${page}`);
  const j = await r.json().catch(() => null);
  if (!r.ok || j?.success !== true) {
    throw new Error(`/api/leads page ${page}: ${r.status}`);
  }
  return { total: Number(j.data?.total ?? 0), leads: j.data?.leads ?? [] };
}

/** Published-lead total and distinct regions across every /api/leads page.
 * Rejects if any page fails or disagrees with page 1 (an empty or shifted
 * page), so callers keep their fallback numbers instead of partial ones. */
export async function collectLeadStats(
  fetchPage: (page: number) => Promise<LeadsPage>
): Promise<{ total: number; regions: number }> {
  const first = await fetchPage(1);
  const pages = Math.min(Math.ceil(first.total / LEADS_PAGE_SIZE), MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => fetchPage(i + 2))
  );
  for (const page of rest) {
    if (page.total !== first.total || page.leads.length === 0) {
      throw new Error('/api/leads pages disagree');
    }
  }
  const regions = new Set<string>();
  for (const { leads } of [first, ...rest]) {
    for (const l of leads) {
      const name = leadRegionName(l.region, 'ru') || (l.region ?? '').trim();
      if (name) regions.add(name);
    }
  }
  return { total: first.total, regions: regions.size };
}
