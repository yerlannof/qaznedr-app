/** @jest-environment node */
import { existsSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { HIDDEN_ROUTE_REDIRECTS } from '@/lib/seo/pages';
import { LOCALES } from '@/lib/seo/site';
import { middleware, config } from '@/middleware';

const ROOT = path.resolve(__dirname, '../..');

describe('middleware location', () => {
  // The app lives in src/app, so Next.js only loads src/middleware.ts;
  // a root middleware.ts is silently ignored (that is how the hidden-route
  // redirects never ran in the first place).
  it('lives in src/, with no ignored copy at the repo root', () => {
    expect(existsSync(path.join(ROOT, 'src/middleware.ts'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'middleware.ts'))).toBe(false);
  });
});

describe('default locale entry', () => {
  it('permanently redirects the bare domain without JavaScript and keeps campaign parameters', () => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: '/', nextConfig: {} })
    ).toBe(true);
    const res = middleware(
      new NextRequest('https://qaznedr.kz/?utm_source=baidu&utm_campaign=a%20b')
    );
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe(
      'https://qaznedr.kz/ru?utm_source=baidu&utm_campaign=a%20b'
    );
  });
});

describe('hidden marketplace routes', () => {
  it('redirects with 308 to the replacement, keeping the locale', () => {
    const res = middleware(
      new NextRequest('https://qaznedr.kz/zh/listings/abc?x=1')
    );
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://qaznedr.kz/zh/leads');
  });

  it('carries campaign tags but drops old marketplace filters', () => {
    const res = middleware(
      new NextRequest(
        'https://qaznedr.kz/ru/listings?region=Мангистауская&page=3&utm_source=wechat&gclid=abc'
      )
    );
    expect(res.headers.get('location')).toBe(
      'https://qaznedr.kz/ru/leads?utm_source=wechat&gclid=abc'
    );
  });

  it('lets look-alike and regular pages through', () => {
    for (const p of [
      '/ru/admin/listings',
      '/ru/services/geological',
      '/ru/listingsx',
      '/ru/auth/login',
      '/en/leads',
    ]) {
      const res = middleware(new NextRequest(`https://qaznedr.kz${p}`));
      expect(res.headers.get('location')).toBeNull();
    }
  });

  it('matcher covers every hidden prefix in every locale', () => {
    for (const locale of LOCALES) {
      for (const [prefix] of HIDDEN_ROUTE_REDIRECTS) {
        for (const url of [`/${locale}${prefix}`, `/${locale}${prefix}/x`]) {
          expect(
            unstable_doesMiddlewareMatch({ config, url, nextConfig: {} })
          ).toBe(true);
        }
      }
    }
  });

  it('matcher skips API and static assets', () => {
    for (const url of ['/api/inquiries', '/_next/static/a.js', '/robots.txt']) {
      expect(
        unstable_doesMiddlewareMatch({ config, url, nextConfig: {} })
      ).toBe(false);
    }
  });
});

describe('translated Kazakh guides', () => {
  const slug = 'foreign-investor-subsoil-rights-kazakhstan';

  it('serves the Kazakh guide without a redirect', () => {
    const res = middleware(
      new NextRequest(`https://qaznedr.kz/kz/insights/${slug}`)
    );
    expect(res.headers.get('location')).toBeNull();
  });

  it('keeps query parameters on the Kazakh guide without redirecting', () => {
    const res = middleware(
      new NextRequest(
        `https://qaznedr.kz/kz/insights/${slug}?utm_source=wechat&utm_campaign=a%20b`
      )
    );
    expect(res.headers.get('location')).toBeNull();
  });

  it('serves written languages, the index and unknown slugs as is', () => {
    for (const p of [
      `/zh/insights/${slug}`,
      `/ru/insights/${slug}`,
      `/kz/insights/${slug}`,
      '/kz/insights',
      '/kz/insights/unknown-guide',
    ]) {
      const res = middleware(new NextRequest(`https://qaznedr.kz${p}`));
      expect(res.headers.get('location')).toBeNull();
    }
  });
});
