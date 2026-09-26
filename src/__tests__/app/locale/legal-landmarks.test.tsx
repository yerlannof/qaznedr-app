/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FaqPage from '@/app/[locale]/faq/page';
import TermsPage from '@/app/[locale]/legal/terms/page';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/ClosingCta', () => () => null);
jest.mock('@/components/features/GuideLinks', () => () => null);

describe('localized FAQ and Russian terms landmarks', () => {
  it('marks the Russian FAQ fallback with lang=ru for kz readers', async () => {
    const html = renderToStaticMarkup(
      await FaqPage({ params: Promise.resolve({ locale: 'kz' }) })
    );
    expect(html).toContain('lang="ru"');
    expect(html).toContain('Что делает QAZNEDR HOLDING?');
  });

  it('keeps Russian terms language-marked without nesting a main landmark', async () => {
    const html = renderToStaticMarkup(
      await TermsPage({ params: Promise.resolve({ locale: 'en' }) })
    );
    expect(html).toContain('lang="ru"');
    expect(html).not.toContain('<main');
    expect(html).not.toContain('</main>');
    expect(html).toContain('Условия использования');
  });
});
