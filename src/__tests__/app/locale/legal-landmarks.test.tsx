/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FaqPage from '@/app/[locale]/faq/page';
import TermsPage from '@/app/[locale]/legal/terms/page';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/ClosingCta', () => () => null);
jest.mock('@/components/features/GuideLinks', () => () => null);

describe('localized FAQ and terms landmarks', () => {
  it.each([
    ['ru', 'ru', 'Что делает QAZNEDR HOLDING?'],
    ['kz', 'kk', 'QAZNEDR HOLDING немен айналысады?'],
    ['en', 'en', 'What does QAZNEDR HOLDING do?'],
    ['zh', 'zh-CN', 'QAZNEDR HOLDING 做什么？'],
  ])('renders FAQ in %s with lang=%s', async (locale, lang, question) => {
    const html = renderToStaticMarkup(
      await FaqPage({ params: Promise.resolve({ locale }) })
    );
    expect(html).toContain(`lang="${lang}"`);
    expect(html).toContain(question);
  });

  it.each([
    ['ru', 'ru', 'Условия использования'],
    ['kz', 'kk', 'Пайдалану шарттары'],
    ['en', 'en', 'Terms of Use'],
    ['zh', 'zh-CN', '使用条款'],
  ])(
    'renders terms in %s with lang=%s without nested main',
    async (locale, lang, heading) => {
      const html = renderToStaticMarkup(
        await TermsPage({ params: Promise.resolve({ locale }) })
      );
      expect(html).toContain(`lang="${lang}"`);
      expect(html).toContain(heading);
      expect(html).not.toContain('<main');
      expect(html).not.toContain('</main>');
    }
  );
});
