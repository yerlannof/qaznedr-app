import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { translate } from '@/lib/i18n/translations';
import LocaleLayout from '@/app/[locale]/layout';
import NotFound from '@/app/[locale]/not-found';
jest.mock('next/font/local', () => ({ __esModule: true, default: () => ({}) }));
jest.mock('@/providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/providers/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/monitoring/WebVitalsTracker', () => ({
  WebVitalsTracker: () => null,
}));
jest.mock('@/components/layouts/MobileTabBar', () => () => null);
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('sonner', () => ({ Toaster: () => null }));
jest.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
jest.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'ru',
    t: (key: string) => translate('ru', key),
  }),
}));

it.each([
  ['ru', 'Перейти к содержимому'],
  ['kz', 'Мазмұнға өту'],
  ['en', 'Skip to content'],
  ['zh', '跳转到主要内容'],
])(
  'localizes the skip link on %s and supplies a focusable target',
  async (locale, label) => {
    const tree = await LocaleLayout({
      params: Promise.resolve({ locale }),
      children: <p>Content</p>,
    });
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(tree),
      'text/html'
    );
    expect(doc.querySelector('a[href="#main"]')?.textContent).toBe(label);
    expect(doc.querySelector('#main')?.getAttribute('tabindex')).toBe('-1');
  }
);

it('keeps the 404 inside the single layout main landmark', () => {
  render(
    <main id="main">
      <NotFound />
    </main>
  );
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    translate('ru', 'notFound.title')
  );
});
