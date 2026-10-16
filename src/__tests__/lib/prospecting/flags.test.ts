import { getPublicPlot, listPublicPlots } from '@/lib/prospecting/plots';
import sitemap from '@/app/sitemap';

jest.mock('@/lib/seo/sitemap-leads', () => ({
  loadSitemapLeadCodes: jest.fn().mockResolvedValue([]),
}));

// Owner 2026-10-16: prospecting plots are off the site until further notice.
describe('prospecting switched off', () => {
  const saved = process.env.PROSPECTING_ENABLED;
  beforeEach(() => {
    delete process.env.PROSPECTING_ENABLED;
  });
  afterEach(() => {
    process.env.PROSPECTING_ENABLED = saved;
  });

  it('shows no plots', () => {
    expect(listPublicPlots()).toEqual([]);
    expect(getPublicPlot('QN-P07')).toBeNull();
  });

  it('keeps every prospecting URL out of the sitemap', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes('/prospecting'))).toBe(false);
  });
});
