import {
  HIDDEN_ROUTE_REDIRECTS,
  PUBLIC_PAGES,
  hiddenRouteRedirect,
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
