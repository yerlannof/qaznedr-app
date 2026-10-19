import 'server-only';
import { listPublishedLeads } from './public-queries';
import { collectLeadStats, LEADS_PAGE_SIZE } from './stats';
import type { LeadTeaser } from './types';
import { isCoalShowcase, isShowcaseRow, parseShowcase } from './showcase';

export interface HomeSnapshot {
  stats: { total: number; regions: number } | null;
  leads: LeadTeaser[];
  /** Published coal finds, for the home tile into the coal filter. */
  coal: number;
}

const TTL_MS = 60_000;
let cached: { at: number; value: HomeSnapshot } | null = null;

/**
 * Showcase cards reach the home page only when marked featured — the pair and
 * the one caveat line were chosen in writing by the geobase (29.09.2026); a
 * spike or untyped number without its caveats would oversell.
 * Legacy rows without a showcase card keep the first-two behaviour.
 */
function pickHomeLeads(rows: LeadTeaser[]): LeadTeaser[] {
  if (!rows.some(isShowcaseRow)) return rows.slice(0, 2);
  const cards = rows
    .map((lead) => ({ lead, card: parseShowcase(lead.showcase) }))
    .filter((x) => x.card);
  return cards
    .filter((x) => x.card!.featured)
    .sort((a, b) => a.card!.featured!.rank - b.card!.featured!.rank)
    .slice(0, 2)
    .map((x) => x.lead);
}

/** Server-render real teasers; an unavailable database is never a made-up count. */
export async function loadHomeSnapshot(): Promise<HomeSnapshot> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let leads: LeadTeaser[] = [];
  let coal = 0;
  try {
    const stats = await collectLeadStats(async (page) => {
      const result = await listPublishedLeads({ page, limit: LEADS_PAGE_SIZE });
      if (page === 1) leads = pickHomeLeads(result.leads);
      coal += result.leads.filter((lead) => {
        const card = parseShowcase(lead.showcase);
        return card ? isCoalShowcase(card) : false;
      }).length;
      return result;
    });
    const value = { stats, leads, coal };
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return { stats: null, leads: [], coal: 0 };
  }
}
