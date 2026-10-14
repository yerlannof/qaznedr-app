import {
  captureAttribution,
  isPublicPath,
  readAttribution,
} from '@/lib/analytics/attribution';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { INSIGHTS } from '@/lib/insights/registry';
import { listPublishedOffers } from '@/lib/offers';
import { listPublicPlots } from '@/lib/prospecting/plots';

beforeEach(() => sessionStorage.clear());

it('recognizes only the published prospecting route shapes in each locale', () => {
  for (const locale of ['ru', 'kz', 'en', 'zh']) {
    expect(isPublicPath(`/${locale}/prospecting`)).toBe(true);
    expect(isPublicPath(`/${locale}/prospecting/QN-P01`)).toBe(true);
    expect(isPublicPath(`/${locale}/prospecting/QN-P99`)).toBe(true);
    for (const suffix of [
      '/QN-P1',
      '/QN-P001',
      '/QN-PAA',
      '/anything',
      '/QN-P01/full',
      '/QN-P01/private',
    ]) {
      expect(isPublicPath(`/${locale}/prospecting${suffix}`)).toBe(false);
    }
  }
  expect(isPublicPath('/fr/prospecting/QN-P01')).toBe(false);
  expect(isPublicPath('/prospecting/QN-P01')).toBe(false);
  expect(isPublicPath('/ru/prospecting-private')).toBe(false);
});

it('recognizes offer detail codes but excludes the redirected index and private lookalikes', () => {
  for (const locale of ['ru', 'kz', 'en', 'zh']) {
    expect(isPublicPath(`/${locale}/offers/QN-A01`)).toBe(true);
    expect(isPublicPath(`/${locale}/offers/QN-A123`)).toBe(true);
    expect(isPublicPath(`/${locale}/offers`)).toBe(false);
    for (const suffix of [
      '/QN-A1',
      '/QN-AAB',
      '/anything',
      '/QN-A01/full',
      '/QN-A01/private',
    ]) {
      expect(isPublicPath(`/${locale}/offers${suffix}`)).toBe(false);
    }
  }
  expect(isPublicPath('/fr/offers/QN-A01')).toBe(false);
});

it('covers the static and content-backed public sitemap routes', () => {
  const paths = [
    ...PUBLIC_PAGES,
    ...INSIGHTS.map((entry) => `/insights/${entry.slug}`),
    ...listPublishedOffers().map((offer) => `/offers/${offer.code}`),
    ...listPublicPlots().map((plot) => `/prospecting/${plot.code}`),
  ];
  expect(listPublishedOffers().length).toBeGreaterThan(0);
  expect(listPublicPlots().length).toBeGreaterThan(0);
  for (const locale of ['ru', 'kz', 'en', 'zh']) {
    for (const path of paths) {
      expect(isPublicPath(`/${locale}${path}`)).toBe(true);
    }
  }
});

it.each(['/zh/prospecting/QN-P01', '/zh/offers/QN-A01'])(
  'retains the first %s landing when the visitor opens contact',
  (path) => {
    const first = captureAttribution(
      path,
      '?utm_source=baidu&utm_campaign=plots&email=private',
      'https://www.baidu.com/s?secret=private',
      1000
    );
    expect(first).toEqual({
      landing_path: path,
      source: 'baidu',
      campaign: 'plots',
      referrer_host: 'www.baidu.com',
    });
    expect(readAttribution('/zh/contact', '', 1001)).toEqual(first);
    expect(
      captureAttribution('/zh/contact', '?utm_source=direct', '', 1002)
    ).toEqual(first);
    expect(JSON.stringify(first)).not.toContain('private');
  }
);

it('keeps first tagged landing across navigation and expires after 30 minutes', () => {
  const first = captureAttribution(
    '/zh/leads',
    '?utm_source=baidu&utm_campaign=gold&gclid=secret',
    'https://www.baidu.com/s?q=gold',
    1000
  );
  expect(first).toEqual({
    source: 'baidu',
    campaign: 'gold',
    landing_path: '/zh/leads',
    referrer_host: 'www.baidu.com',
  });
  expect(
    captureAttribution('/zh/contact', '?utm_source=other', '', 1001)
  ).toEqual(first);
  expect(readAttribution('/zh/contact', '', 1002)).toEqual(first);
  expect(
    captureAttribution(
      '/zh/contact',
      '?utm_source=new',
      '',
      1000 + 30 * 60 * 1000
    )
  ).toEqual({ source: 'new', landing_path: '/zh/contact' });
});

it('captures direct entry and discards internal or malformed referrers', () => {
  expect(
    captureAttribution(
      '/en/contact',
      '',
      'https://qaznedr.kz/leads?token=secret',
      1
    )
  ).toEqual({ landing_path: '/en/contact' });
  sessionStorage.clear();
  expect(captureAttribution('/en/contact', '', 'javascript:secret', 1)).toEqual(
    { landing_path: '/en/contact' }
  );
});

it('does not capture private, auth or API routes', () => {
  expect(
    captureAttribution('/zh/admin/inquiries', '?utm_source=x', '', 1)
  ).toBeUndefined();
  expect(
    captureAttribution('/zh/auth/login', '?utm_source=x', '', 1)
  ).toBeUndefined();
  expect(
    captureAttribution('/api/inquiries', '?utm_source=x', '', 1)
  ).toBeUndefined();
  expect(
    captureAttribution('/zh/leads/AU-4/full', '?utm_source=x', '', 1)
  ).toBeUndefined();
  expect(
    captureAttribution('/zh/contact/private-email', '?utm_source=x', '', 1)
  ).toBeUndefined();
  expect(sessionStorage.length).toBe(0);
});

it('recovers from corrupt storage and ignores forbidden or oversized fields', () => {
  sessionStorage.setItem('qaznedr_attribution', '{oops');
  expect(
    captureAttribution(
      '/ru',
      '?utm_source=' + 'x'.repeat(205) + '&utm_medium=cpc&email=secret',
      '',
      1
    )
  ).toEqual({ medium: 'cpc', landing_path: '/ru' });
  expect(sessionStorage.getItem('qaznedr_attribution')).not.toContain('secret');
});

it('falls back to the current URL when storage is denied', () => {
  const spy = jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new Error('denied');
    });
  expect(readAttribution('/en/contact', '?utm_source=google', 1)).toEqual({
    source: 'google',
    landing_path: '/en/contact',
  });
  spy.mockRestore();
});
