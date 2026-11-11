/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightArticlePage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/insights/[slug]/page';
import InsightsPage from '@/app/[locale]/insights/page';
import OgImage, {
  generateStaticParams as ogStaticParams,
} from '@/app/[locale]/insights/[slug]/opengraph-image';
import sitemap from '@/app/sitemap';
import { getArticle, listArticles } from '@/lib/insights/content';
import { GUIDE, findInsight, insightHref } from '@/lib/insights/registry';
import { insightLocaleRedirect } from '@/lib/insights/routing';
import {
  guideFromPath,
  guideSourcePath,
  guideTitle,
} from '@/lib/insights/contact-context';
import { translate } from '@/lib/i18n/translations';
import { readFileSync } from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}));
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
jest.mock('@/lib/equipment-listings/catalog-repository', () => ({
  listActiveForSitemap: jest.fn(async () => []),
}));
jest.mock('@/lib/equipment-listings/companies', () => ({
  listCompanies: jest.fn(async () => []),
}));

const slug = GUIDE.checkArea;
const WRITTEN = ['ru', 'kz'] as const;
const FALLBACK = ['en', 'zh'] as const;
/** The opening tag of the link to the Russian version of the guide. */
const russianLink = (html: string) =>
  new RegExp(`<a\\b[^>]*href="/ru/insights/${slug}"[^>]*>`).exec(html)?.[0] ??
  '';
const url = (locale: string) => `https://qaznedr.kz/${locale}/insights/${slug}`;

it('registers a dated legal guide written in Russian and Kazakh only', () => {
  expect(slug).toBe('check-subsoil-area-kazakhstan');
  expect(findInsight(slug)).toMatchObject({
    category: 'licensing',
    published: '2026-11-12',
    updated: '2026-11-12',
    legal: true,
    lawAsOf: '2026-11-12',
    locales: ['ru', 'kz'],
  });
});

it('lists only the written languages in llms.txt', () => {
  const row = readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
    .split('\n')
    .find((line) => line.includes(`/insights/${slug}`));
  expect(row).toContain(url('ru'));
  expect(row).toContain(url('kz'));
  expect(row).not.toContain(url('en'));
  expect(row).not.toContain(url('zh'));
});

it.each(WRITTEN)(
  '%s guide has canonical metadata, hreflang for ru and kz only and official sources',
  async (locale) => {
    const article = getArticle(slug, locale);
    expect(article).not.toBeNull();
    expect(article?.citations).toEqual([
      'https://adilet.zan.kz/rus/docs/K1700000125',
      `https://minerals.e-qazyna.kz/${locale}/start`,
      'https://minerals.e-qazyna.kz/ru/minerals/gosuslugi',
      `https://minerals.e-qazyna.kz/${locale}/contracts-map`,
      'https://minerals.e-qazyna.kz/ru/guest/reestr/announcements',
      'https://minerals-map.e-qazyna.kz/ru/analytics',
    ]);
    const params = Promise.resolve({ locale, slug });
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(url(locale));
    expect(metadata.alternates?.languages).toEqual({
      ru: url('ru'),
      kk: url('kz'),
      'x-default': url('ru'),
    });
    expect(metadata.description).toBe(article?.description);
    expect(insightHref(locale, slug)).toBe(`/${locale}/insights/${slug}`);
    expect(guideFromPath(`/${locale}/insights/${slug}`)).toBe(slug);
    const html = renderToStaticMarkup(await InsightArticlePage({ params }));
    expect(html.match(/<h1\b/g) ?? []).toHaveLength(1);
    expect(html).toContain(
      `href="/${locale}/contact?service=geology&amp;guide=${slug}"`
    );
    expect(html).toContain(`href="/${locale}/leads"`);
    for (const key of [
      'artisanalMining',
      'explorationLicence',
      'pugfn',
      'goldLicenceTypes',
      'licenceCosts',
    ] as const) {
      expect(html).toContain(`href="/${locale}/insights/${GUIDE[key]}"`);
    }
    expect(html).toContain('<table');
    expect(html).toContain('Article');
    expect(html).toContain('BreadcrumbList');
  }
);

it.each(WRITTEN)(
  '%s guide cites the Code articles it relies on and dates the check',
  (locale) => {
    const text = getArticle(slug, locale)?.html ?? '';
    for (const article of ['25', '68-1', '70', '186', '189-1', '264', '267'])
      expect(text).toContain(article);
    expect(text).toContain('1 000');
    expect(text).toContain(
      locale === 'ru' ? '12 ноября 2026' : '12 қарашадағы'
    );
    expect(text).toContain(
      locale === 'ru' ? 'Проверка ограничений' : 'Шектеулерді тексеру'
    );
  }
);

describe.each(FALLBACK)('%s readers', (locale) => {
  it('have no page of their own and are sent to the Russian version', async () => {
    expect(getArticle(slug, locale)).toBeNull();
    expect(
      await generateMetadata({ params: Promise.resolve({ locale, slug }) })
    ).toEqual({});
    expect(insightHref(locale, slug)).toBe(`/ru/insights/${slug}`);
    expect(insightLocaleRedirect(`/${locale}/insights/${slug}`)).toBe(
      `/ru/insights/${slug}`
    );
    expect(guideSourcePath(locale, slug)).toBe(`/ru/insights/${slug}`);
    expect(guideTitle(locale, slug)).toBeTruthy();
  });

  it('get no prerendered page or Open Graph card', async () => {
    for (const params of [generateStaticParams(), ogStaticParams()]) {
      const langs = params
        .filter((p) => p.slug === slug)
        .map((p) => p.locale)
        .sort();
      expect(langs).toEqual(['kz', 'ru']);
    }
    const response = await OgImage({
      params: Promise.resolve({ locale, slug }),
    });
    expect(response.status).toBe(404);
  });

  it('see the Russian card on the guide index, marked as Russian', async () => {
    const card = listArticles(locale).find((c) => c.slug === slug);
    expect(card?.locale).toBe('ru');
    const html = renderToStaticMarkup(
      await InsightsPage({ params: Promise.resolve({ locale }) })
    );
    expect(russianLink(html)).toContain('lang="ru"');
    expect(html).toContain(translate(locale, 'insights.onlyRu'));
  });

  it('reach it from related guides through the Russian link', async () => {
    const html = renderToStaticMarkup(
      await InsightArticlePage({
        params: Promise.resolve({ locale, slug: GUIDE.artisanalMining }),
      })
    );
    expect(russianLink(html)).toContain('lang="ru"');
    expect(html).not.toContain(`/${locale}/insights/${slug}`);
  });

  it('do not get a link to a missing translation from other guides', () => {
    for (const key of [
      'artisanalMining',
      'pugfn',
      'explorationLicence',
    ] as const) {
      expect(getArticle(GUIDE[key], locale)?.html).not.toContain(
        `/insights/${slug}`
      );
    }
  });
});

it.each(WRITTEN)(
  '%s artisanal, PUGFN and exploration guides link to the area check',
  (locale) => {
    for (const key of [
      'artisanalMining',
      'pugfn',
      'explorationLicence',
    ] as const) {
      expect(getArticle(GUIDE[key], locale)?.html).toContain(
        `href="/${locale}/insights/${slug}"`
      );
    }
  }
);

describe('sitemap', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists the guide in ru and kz with hreflang for those two only', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { leads: [], page: 1, limit: 50, total: 0, totalPages: 0 },
      }),
    });
    const entries = (await sitemap()).filter((e) =>
      e.url.endsWith(`/insights/${slug}`)
    );
    expect(entries.map((e) => e.url).sort()).toEqual([url('kz'), url('ru')]);
    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({
        ru: url('ru'),
        kk: url('kz'),
        'x-default': url('ru'),
      });
      expect(entry.lastModified).toEqual(new Date('2026-11-12'));
    }
  });
});
