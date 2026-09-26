import { leadRegionName } from '@/lib/seo/lead-metadata';

/** /api/leads caps `limit` at 50. */
export const LEADS_PAGE_SIZE = 50;
const MAX_PAGES = 20;

export interface LeadsPage {
  total: number;
  leads: { region?: string | null }[];
}

/** Published-lead total and distinct regions across every /api/leads page.
 * Rejects if any page fails, so callers keep their fallback numbers. */
export async function collectLeadStats(
  fetchPage: (page: number) => Promise<LeadsPage>
): Promise<{ total: number; regions: number }> {
  const first = await fetchPage(1);
  const pages = Math.min(Math.ceil(first.total / LEADS_PAGE_SIZE), MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => fetchPage(i + 2))
  );
  const regions = new Set<string>();
  for (const { leads } of [first, ...rest]) {
    for (const l of leads) {
      const name = leadRegionName(l.region, 'ru') || (l.region ?? '').trim();
      if (name) regions.add(name);
    }
  }
  return { total: first.total, regions: regions.size };
}
