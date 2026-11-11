/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from '@/app/[locale]/page';
import { translate } from '@/lib/i18n/translations';
jest.mock('@/lib/leads/home', () => ({
  loadHomeSnapshot: jest
    .fn()
    .mockResolvedValue({ stats: null, leads: [], coal: 0 }),
}));
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'ru',
    t: (key: string) => translate('ru', key),
  }),
}));

it.each(['ru', 'kz', 'en', 'zh'])(
  'server-renders the %s home with localized guide and contact links',
  async (locale) => {
    const html = renderToStaticMarkup(
      await Home({ params: Promise.resolve({ locale }) })
    );
    const scripts = [
      ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ];
    const organization = scripts
      .map((match) => JSON.parse(match[1]))
      .find((schema) => schema['@type'] === 'Organization');
    expect(organization.sameAs).toEqual([
      'https://www.instagram.com/qaznedr.kz/',
    ]);
    // Approved square brand mark (A3 master), 180 px PNG.
    expect(organization.logo).toBe(
      'https://qaznedr.kz/brand/apple-touch-icon.png'
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(translate(locale, 'portal.headlineLine1'));
    expect(html).toContain(
      `/${locale}/insights/foreign-investor-subsoil-rights-kazakhstan`
    );
    expect(html).toContain(`/${locale}/contact`);
    expect(html).toContain('7');
    expect(html).not.toMatch(/>31<|>9</);
    // Redesign 20: silent aerial loop with a still poster, labelled as an
    // illustration; the coal tile counts published coal finds.
    expect(html).toContain('hero-ridges.mp4');
    expect(html).toContain('muted');
    // The still under the video is the optimised next/image copy; a poster
    // would download the raw 124 KB file a second time. The video paints
    // nothing until its first frame, so the still shows through instead.
    const video = html.match(/<video\b[^>]*>/)?.[0] ?? '';
    expect(video).toContain('class="home-hero-video"');
    expect(video).not.toContain('poster');
    expect(html).toMatch(
      /<img\b[^>]*src="\/_next\/image\?url=%2Fbrand%2Fphoto%2Fhero-ridges\.webp/
    );
    expect(html).toContain(translate(locale, 'homeV2.illustration'));
  }
);
