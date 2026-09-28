import {
  captureAttribution,
  readAttribution,
} from '@/lib/analytics/attribution';

beforeEach(() => sessionStorage.clear());

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
