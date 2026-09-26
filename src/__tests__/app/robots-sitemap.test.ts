import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

// Unit tests exercise the loader on every call; Next owns persistence/ISR.
jest.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const pageResponse = (page = 1, total = 1, codes = ['AU-508A4C']) => ({
  ok: true,
  status: 200,
  json: async () => ({
    success: true,
    data: {
      leads: codes.map((code) => ({ code })),
      page,
      limit: 50,
      total,
      totalPages: Math.ceil(total / 50),
    },
  }),
});

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
    global.fetch = jest.fn().mockResolvedValue(pageResponse());
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

  it('rejects API failure instead of replacing the sitemap with missing areas', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    await expect(sitemap()).rejects.toThrow();
  });

  it('gives guides hreflang only for their languages', async () => {
    global.fetch = jest.fn().mockResolvedValue(pageResponse());
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

  it('collects every page and caches no individual HTTP response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        pageResponse(
          1,
          51,
          Array.from({ length: 50 }, (_, i) => `AU-${i}`)
        )
      )
      .mockResolvedValueOnce(pageResponse(2, 51, ['CU-51']));
    const entries = await sitemap();
    expect(entries.filter((e) => /\/leads\//.test(e.url))).toHaveLength(204);
    expect(
      entries.some((e) => e.url === 'https://qaznedr.kz/zh/leads/CU-51')
    ).toBe(true);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://qaznedr.kz/api/leads?limit=50&page=2',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it.each([
    [
      'HTTP failure',
      { ...pageResponse(2, 51, ['AU-50']), ok: false, status: 503 },
    ],
    ['API failure', { ok: true, json: async () => ({ success: false }) }],
    ['empty page', pageResponse(2, 51, [])],
    ['changed total', pageResponse(2, 52, ['AU-50', 'AU-51'])],
    ['duplicate code', pageResponse(2, 51, ['AU-0'])],
    ['wrong page', pageResponse(1, 51, ['AU-50'])],
    ['invalid code', pageResponse(2, 51, ['../admin'])],
  ])('rejects a partial snapshot after %s on page two', async (_, second) => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        pageResponse(
          1,
          51,
          Array.from({ length: 50 }, (_, i) => `AU-${i}`)
        )
      )
      .mockResolvedValueOnce(second);
    await expect(sitemap()).rejects.toThrow();
  });

  it('allows a genuinely empty public catalogue and recovers after an error', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce(pageResponse(1, 0, []));
    await expect(sitemap()).rejects.toThrow();
    const entries = await sitemap();
    expect(entries.some((e) => e.url === 'https://qaznedr.kz/zh/leads')).toBe(
      true
    );
    expect(entries.some((e) => /\/leads\//.test(e.url))).toBe(false);
  });

  it('omits invented modification dates but keeps recorded article dates', async () => {
    global.fetch = jest.fn().mockResolvedValue(pageResponse());
    const entries = await sitemap();
    expect(
      entries.find((e) => e.url === 'https://qaznedr.kz/zh')?.lastModified
    ).toBeUndefined();
    expect(
      entries.find((e) => e.url.endsWith('/leads/AU-508A4C'))?.lastModified
    ).toBeUndefined();
    expect(
      entries.find((e) => e.url.includes('/insights/'))?.lastModified
    ).toBeInstanceOf(Date);
  });
});
