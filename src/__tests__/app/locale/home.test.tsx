/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from '@/app/[locale]/page';
import { translate } from '@/lib/i18n/translations';
jest.mock('@/lib/leads/home', () => ({
  loadHomeSnapshot: jest.fn().mockResolvedValue({ stats: null, leads: [] }),
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
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(translate(locale, 'portal.headlineLine1'));
    const guideLocale = locale === 'kz' ? 'ru' : locale;
    expect(html).toContain(
      `/${guideLocale}/insights/foreign-investor-subsoil-rights-kazakhstan`
    );
    expect(html).toContain(`/${locale}/contact`);
    expect(html).toContain('7');
    expect(html).not.toMatch(/>31<|>9</);
    expect(html).toContain('data-mode="static"');
    expect(html).toContain(translate(locale, 'geologyScene.disclaimer'));
    for (const stage of [1, 2, 3]) {
      expect(html).toContain(
        translate(locale, `geologyScene.stage${stage}Title`)
      );
    }
  }
);
