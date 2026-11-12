/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AboutPage from '@/app/[locale]/about/page';
import { translate } from '@/lib/i18n/translations';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

it.each(['ru', 'kz', 'en', 'zh'])(
  'renders %s about with a labelled photo header and destination links',
  async (locale) => {
    const html = renderToStaticMarkup(
      await AboutPage({ params: Promise.resolve({ locale }) })
    );
    expect(html).toContain('%2Fbrand%2Fphoto%2Fscene-geologists.webp');
    expect(html).toContain(translate(locale, 'homeV2.illustration'));
    expect(html).not.toContain('%2Fbrand%2Farchive-to-field-960.webp');
    for (const path of ['leads', 'contact', 'faq']) {
      expect(html).toContain(`href="/${locale}/${path}"`);
    }
  }
);

it.each([
  ['en', true],
  ['ru', false],
  ['kz', false],
  ['zh', false],
])('shows the Technology block on %s: %s', async (locale, shown) => {
  const html = renderToStaticMarkup(
    await AboutPage({ params: Promise.resolve({ locale }) })
  );
  expect(html.includes('id="technology"')).toBe(shown);
  if (shown) {
    expect(html).toContain('AI knowledge base');
    expect(html).toContain('checked against the original scan');
  }
});
