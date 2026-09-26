import {
  HIDDEN_ROUTE_REDIRECTS,
  PUBLIC_PAGES,
  hiddenRouteRedirect,
  trackingQuery,
} from '@/lib/seo/pages';

describe('hiddenRouteRedirect', () => {
  it.each([
    ['/zh/listings', '/zh/leads'],
    ['/en/listings/abc-123', '/en/leads'],
    ['/ru/listings/create', '/ru/leads'],
    ['/kz/companies', '/kz/about'],
    ['/ru/services/catalog', '/ru/services'],
    ['/ru/services/equipment', '/ru/services'],
    ['/en/dashboard', '/en/leads'],
    ['/en/dashboard/my-leads', '/en/leads'],
    ['/ru/favorites', '/ru/leads'],
    ['/ru/messages', '/ru/contact'],
    ['/zh/auth/register', '/zh/contact'],
    ['/ru/map', '/ru/leads'],
  ])('%s → %s', (from, to) => {
    expect(hiddenRouteRedirect(from)).toBe(to);
  });

  it.each([
    '/ru',
    '/ru/leads',
    '/ru/leads/AU-1',
    '/ru/services',
    '/ru/services/geological',
    '/ru/listingsx',
    '/ru/admin',
    '/ru/admin/listings',
    '/ru/auth/login',
    '/de/listings',
    '/api/listings',
  ])('%s is left alone', (path) => {
    expect(hiddenRouteRedirect(path)).toBeNull();
  });

  it('never lists a hidden route as a public page', () => {
    for (const page of PUBLIC_PAGES) {
      for (const [prefix] of HIDDEN_ROUTE_REDIRECTS) {
        expect(page === prefix || page.startsWith(`${prefix}/`)).toBe(false);
      }
    }
  });
});

describe('session 2 hidden routes', () => {
  it('redirects support and the investors directory to contact', () => {
    expect(hiddenRouteRedirect('/ru/support')).toBe('/ru/contact');
    expect(hiddenRouteRedirect('/en/services/investors')).toBe('/en/contact');
    expect(hiddenRouteRedirect('/en/services/investors/x')).toBe('/en/contact');
    expect(hiddenRouteRedirect('/ru/services')).toBeNull();
    expect(hiddenRouteRedirect('/ru/services/legal')).toBeNull();
  });

  it('keeps them out of the sitemap', () => {
    expect(PUBLIC_PAGES).not.toContain('/support');
    expect(PUBLIC_PAGES).not.toContain('/services/investors');
  });
});

describe('session 3: content sections merged into /insights', () => {
  it.each([
    ['/ru/blog', '/ru/insights'],
    ['/en/blog/2', '/en/insights'],
    ['/zh/education', '/zh/insights'],
    ['/kz/knowledge', '/kz/insights'],
    ['/ru/news/kazakhstan-gold', '/ru/insights'],
  ])('%s → %s', (from, to) => {
    expect(hiddenRouteRedirect(from)).toBe(to);
  });

  it('lists /insights, not the old sections', () => {
    expect(PUBLIC_PAGES).toContain('/insights');
    for (const old of ['/blog', '/education', '/knowledge', '/news']) {
      expect(PUBLIC_PAGES).not.toContain(old);
    }
    expect(hiddenRouteRedirect('/ru/insights')).toBeNull();
    expect(hiddenRouteRedirect('/ru/insights/x')).toBeNull();
  });
});

describe('trackingQuery', () => {
  it('keeps utm_*, gclid, yclid, fbclid and msclkid only', () => {
    expect(
      trackingQuery(
        new URLSearchParams(
          'region=x&utm_source=a&utm_campaign=b&gclid=1&yclid=2&fbclid=3&msclkid=4&page=2'
        )
      )
    ).toBe('?utm_source=a&utm_campaign=b&gclid=1&yclid=2&fbclid=3&msclkid=4');
  });

  it('is empty when nothing is worth keeping', () => {
    expect(trackingQuery(new URLSearchParams('region=x&page=2'))).toBe('');
    expect(trackingQuery(new URLSearchParams(''))).toBe('');
  });
});
