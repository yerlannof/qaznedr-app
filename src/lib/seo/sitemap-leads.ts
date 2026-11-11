import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { SITE_URL } from './site';

const PAGE_SIZE = 50;
const MAX_PAGES = 100;
const responseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    page: z.number().int().positive(),
    limit: z.literal(PAGE_SIZE),
    total: z
      .number()
      .int()
      .min(0)
      .max(PAGE_SIZE * MAX_PAGES),
    totalPages: z.number().int().min(0).max(MAX_PAGES),
    leads: z.array(
      z.object({
        code: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/),
        // Required (null allowed): mineral hubs are listed from these rows, so
        // a response without the field must fail rather than drop the hubs.
        mineral: z.string().max(200).nullable(),
      })
    ),
  }),
});

export interface SitemapLead {
  code: string;
  mineral: string | null;
}

async function fetchCompleteLeads(): Promise<SitemapLead[]> {
  const codes = new Set<string>();
  const rows: SitemapLead[] = [];
  let total: number | undefined;
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(
      `${SITE_URL}/api/leads?limit=${PAGE_SIZE}&page=${page}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!res.ok) throw new Error('Unable to load sitemap areas');
    const { data } = responseSchema.parse(await res.json());
    total ??= data.total;
    pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const expectedRows = Math.min(PAGE_SIZE, total - (page - 1) * PAGE_SIZE);
    if (
      data.page !== page ||
      data.total !== total ||
      data.totalPages !== Math.ceil(total / PAGE_SIZE) ||
      data.leads.length !== expectedRows
    ) {
      throw new Error('Incomplete sitemap areas');
    }
    for (const { code, mineral } of data.leads) {
      if (codes.has(code)) throw new Error('Duplicate sitemap area');
      codes.add(code);
      rows.push({ code, mineral });
    }
  }
  return rows;
}

// Only a validated complete snapshot enters the cache. An exception during
// revalidation preserves the last successful snapshot; never cache a partial
// list or convert an API failure into an empty catalogue.
export const loadSitemapLeads = unstable_cache(
  fetchCompleteLeads,
  ['sitemap-published-leads-v2'],
  { revalidate: 3600 }
);
