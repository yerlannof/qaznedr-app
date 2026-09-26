import {
  collectLeadStats,
  fetchLeadsPage,
  LEADS_PAGE_SIZE,
} from '@/lib/leads/stats';

const lead = (region: string | null) => ({ region });

describe('collectLeadStats', () => {
  it('reads every page and counts distinct regions once', async () => {
    const pages: Record<
      number,
      { total: number; leads: { region: string | null }[] }
    > = {
      1: {
        total: 60,
        leads: [
          ...Array(49).fill(lead('Восточно-Казахстанская область')),
          lead(null),
        ],
      },
      2: {
        total: 60,
        leads: [
          ...Array(9).fill(lead('Карагандинская область')),
          lead('Абайская область'),
        ],
      },
    };
    const calls: number[] = [];
    const stats = await collectLeadStats(async (page) => {
      calls.push(page);
      return pages[page];
    });
    expect(LEADS_PAGE_SIZE).toBe(50);
    expect(calls.sort()).toEqual([1, 2]);
    expect(stats).toEqual({ total: 60, regions: 3 });
  });

  it('asks for one page when everything fits', async () => {
    const calls: number[] = [];
    await collectLeadStats(async (page) => {
      calls.push(page);
      return { total: 31, leads: Array(31).fill(lead('Абайская область')) };
    });
    expect(calls).toEqual([1]);
  });

  it('fails as a whole when a later page fails (no partial counts)', async () => {
    await expect(
      collectLeadStats(async (page) => {
        if (page === 2) throw new Error('503');
        return { total: 60, leads: [lead('Абайская область')] };
      })
    ).rejects.toThrow('503');
  });
});

describe('collectLeadStats with a later page that fails quietly', () => {
  it('rejects when a later page comes back empty (rate limit, DB error)', async () => {
    await expect(
      collectLeadStats(async (page) =>
        page === 1
          ? { total: 60, leads: [lead('Абайская область')] }
          : { total: 0, leads: [] }
      )
    ).rejects.toThrow();
  });

  it('rejects when a later page reports a different total', async () => {
    await expect(
      collectLeadStats(async (page) => ({
        total: page === 1 ? 60 : 59,
        leads: [lead('Абайская область')],
      }))
    ).rejects.toThrow();
  });
});

describe('fetchLeadsPage', () => {
  const respond = (status: number, body: unknown) =>
    (async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })) as unknown as typeof fetch;

  it('asks the API for a full page', async () => {
    const urls: string[] = [];
    const fetcher = (async (url: string) => {
      urls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { total: 3, leads: [] } }),
      };
    }) as unknown as typeof fetch;
    await expect(fetchLeadsPage(2, fetcher)).resolves.toEqual({
      total: 3,
      leads: [],
    });
    expect(urls).toEqual([`/api/leads?limit=${LEADS_PAGE_SIZE}&page=2`]);
  });

  it('throws on a JSON error response such as the 429 of the rate limiter', async () => {
    await expect(
      fetchLeadsPage(2, respond(429, { success: false, error: 'Too many' }))
    ).rejects.toThrow();
  });

  it('throws when the API says success: false', async () => {
    await expect(
      fetchLeadsPage(1, respond(200, { success: false }))
    ).rejects.toThrow();
  });
});

describe('complete statistics only', () => {
  it('rejects totals beyond the bounded page budget instead of counting a subset', async () => {
    await expect(
      collectLeadStats(async () => ({
        total: 1001,
        leads: Array(50).fill(lead('ВКО')),
      }))
    ).rejects.toThrow();
  });
  it.each([1, 2])(
    'rejects a truncated page %s even when its total agrees',
    async (truncated) => {
      await expect(
        collectLeadStats(async (page) => ({
          total: 60,
          leads: Array(page === truncated ? 1 : page === 1 ? 50 : 10).fill(
            lead('ВКО')
          ),
        }))
      ).rejects.toThrow();
    }
  );
});
