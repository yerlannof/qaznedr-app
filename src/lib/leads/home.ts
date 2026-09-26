import 'server-only';
import { listPublishedLeads } from './public-queries';
import { collectLeadStats, LEADS_PAGE_SIZE } from './stats';
import type { LeadTeaser } from './types';

export interface HomeSnapshot {
  stats: { total: number; regions: number } | null;
  leads: LeadTeaser[];
}

const TTL_MS = 60_000;
let cached: { at: number; value: HomeSnapshot } | null = null;

/** Server-render real teasers; an unavailable database is never a made-up count. */
export async function loadHomeSnapshot(): Promise<HomeSnapshot> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let leads: LeadTeaser[] = [];
  try {
    const stats = await collectLeadStats(async (page) => {
      const result = await listPublishedLeads({ page, limit: LEADS_PAGE_SIZE });
      if (page === 1) leads = result.leads.slice(0, 2);
      return result;
    });
    const value = { stats, leads };
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return { stats: null, leads: [] };
  }
}
