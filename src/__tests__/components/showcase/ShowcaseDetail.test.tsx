jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
jest.mock('@/components/features/ContactChannels', () => ({
  __esModule: true,
  default: ({ leadCode }: { leadCode?: string }) => (
    <div data-testid="channels">{leadCode}</div>
  ),
}));
import { render, screen } from '@testing-library/react';
import ShowcaseDetail from '@/components/showcase/ShowcaseDetail';
import { translate } from '@/lib/i18n/translations';
import { contacts, fakeShowcase } from '../../mocks/showcase-fixture';

function renderDetail(locale: 'ru' | 'zh' = 'ru') {
  return render(
    <ShowcaseDetail
      showcase={fakeShowcase}
      locale={locale}
      contacts={contacts}
    />
  );
}

it('has one h1 built from metals and oblast only', () => {
  renderDetail();
  const h1 = screen.getAllByRole('heading', { level: 1 });
  expect(h1).toHaveLength(1);
  expect(h1[0]).toHaveTextContent('Золото, медь — Карагандинская область');
});

it('shows every scan, the source line and the verbatim disclaimer', () => {
  renderDetail();
  expect(
    screen.getAllByAltText('Фрагмент архивного отчёта, названия скрыты')
  ).toHaveLength(2);
  expect(screen.getByText(fakeShowcase.source!.ru)).toBeInTheDocument();
  expect(
    screen.getByText(translate('ru', 'showcase.disclaimer'))
  ).toBeInTheDocument();
});

it('keeps the caveats next to the number', () => {
  renderDetail();
  for (const fact of fakeShowcase.facts.ru) {
    expect(screen.getByText(fact)).toBeInTheDocument();
  }
});

it('uses the site contact block (one WhatsApp, WeChat on zh) keyed by card number', () => {
  const { container } = renderDetail();
  expect(screen.getByTestId('channels')).toHaveTextContent('QN-99');
  expect(container.querySelector('#contact')).not.toBeNull();
  expect(container.querySelectorAll('a[href^="https://wa.me/"]')).toHaveLength(
    0
  );
});

it('draws the region scheme with the single circle and the boundary credit', () => {
  const { container } = renderDetail();
  expect(container.querySelectorAll('[data-zone]')).toHaveLength(1);
  expect(
    screen.getByText(translate('ru', 'showcase.mapCredit'))
  ).toBeInTheDocument();
});

it('shows satellite lines only when the package has them', () => {
  const { rerender } = renderDetail();
  expect(screen.queryByText(/Снимок ASTER/)).not.toBeInTheDocument();
  rerender(
    <ShowcaseDetail
      showcase={{
        ...fakeShowcase,
        satellite: { ru: ['Снимок ASTER: у точки признаки изменения'] },
      }}
      locale="ru"
      contacts={contacts}
    />
  );
  expect(
    screen.getByText('Снимок ASTER: у точки признаки изменения')
  ).toBeInTheDocument();
});
