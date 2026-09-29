/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AboutPage from '@/app/[locale]/about/page';
import { translate } from '@/lib/i18n/translations';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

it.each(['ru', 'kz', 'en', 'zh'])(
  'renders %s about with conditional cutaway, caption and destination links',
  async (locale) => {
    const html = renderToStaticMarkup(
      await AboutPage({ params: Promise.resolve({ locale }) })
    );
    expect(html).toContain('%2Fbrand%2Fgeology-cutaway-960.webp');
    expect(html).toContain(translate(locale, 'geologyScene.note'));
    expect(html).not.toContain('%2Fbrand%2Farchive-to-field-960.webp');
    for (const path of ['leads', 'contact', 'faq']) {
      expect(html).toContain(`href="/${locale}/${path}"`);
    }
  }
);
