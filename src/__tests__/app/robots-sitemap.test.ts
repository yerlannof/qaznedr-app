import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('robots', () => {
  it('blocks private areas including /ru/dashboard without a trailing slash', () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const star = rules.find((x) => x.userAgent === '*');
    expect(star?.disallow).toEqual(
      expect.arrayContaining(['/*/dashboard', '/*/admin', '/api/'])
    );
    expect(r.sitemap).toBe('https://qaznedr.kz/sitemap.xml');
  });
});

describe('sitemap', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists public pages and lead teasers for every locale, no legacy routes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { leads: [{ code: 'AU-508A4C' }], totalPages: 1 },
      }),
    }) as unknown as typeof fetch;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://qaznedr.kz/zh');
    expect(urls).toContain('https://qaznedr.kz/zh/leads/AU-508A4C');
    expect(urls).toContain('https://qaznedr.kz/en/contact');
    expect(urls).toContain('https://qaznedr.kz/kz/insights');
    expect(urls).toContain(
      'https://qaznedr.kz/zh/insights/reserve-classification-gkz-kazrc-jorc-gbt17766'
    );
    expect(urls).not.toContain(
      'https://qaznedr.kz/kz/insights/reserve-classification-gkz-kazrc-jorc-gbt17766'
    );
    expect(urls.some((u) => /\/(blog|education|knowledge|news)$/.test(u))).toBe(
      false
    );
    expect(urls.some((u) => /\/(listings|companies|map)(\/|$)/.test(u))).toBe(
      false
    );
  });

  it('still returns static pages when the leads API is down', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://qaznedr.kz/ru/leads');
  });

  it('gives guides hreflang only for their languages', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const entry = (await sitemap()).find(
      (e) =>
        e.url ===
        'https://qaznedr.kz/en/insights/foreign-investor-subsoil-rights-kazakhstan'
    );
    expect(Object.keys(entry?.alternates?.languages ?? {})).toEqual([
      'ru',
      'en',
      'zh-CN',
      'x-default',
    ]);
  });
});
