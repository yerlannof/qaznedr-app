import { collectLeadStats, LEADS_PAGE_SIZE } from '@/lib/leads/stats';

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
      return { total: 31, leads: [lead('Абайская область')] };
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
