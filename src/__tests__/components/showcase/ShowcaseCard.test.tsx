jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
import { render, screen, within } from '@testing-library/react';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import { contacts, fakeShowcase } from '../../mocks/showcase-fixture';

function renderCard(locale = 'ru', showcase = fakeShowcase, config = contacts) {
  return render(
    <ShowcaseCard
      showcase={showcase}
      locale={locale as 'ru'}
      contacts={config}
    />
  );
}

it('shows the headline verbatim, type words first and the value large', () => {
  renderCard();
  expect(screen.getByText('Максимум в отдельной пробе:')).toBeInTheDocument();
  expect(screen.getByText('золото до 9,9 г/т')).toBeInTheDocument();
});

it('keeps every caveat line and moves only the object type and source', () => {
  renderCard();
  const facts = screen.getByRole('list');
  const items = within(facts)
    .getAllByRole('listitem')
    .map((li) => li.textContent);
  expect(items).toEqual(fakeShowcase.facts.ru);
  expect(
    screen.getByText(
      (_, el) =>
        el?.tagName === 'P' &&
        el.textContent === 'Карагандинская область · Рудопроявление'
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/Источник:/)).not.toBeInTheDocument();
});

it('prints the rights status as is, followed by the check date caveat', () => {
  renderCard();
  expect(
    screen.getByText(
      'Свободен от лицензий на разведку и добычу (наша проверка по карте)'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByText('Проверено 28.09.2026, не выписка.')
  ).toBeInTheDocument();
});

it('offers exactly one WhatsApp button with the card text', () => {
  renderCard();
  const wa = screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('https://wa.me/'));
  expect(wa).toHaveLength(1);
  expect(wa[0]).toHaveAttribute(
    'href',
    `https://wa.me/77001234567?text=${encodeURIComponent(fakeShowcase.whatsapp_text.ru)}`
  );
  expect(wa[0]).toHaveTextContent('Обсудить QN-99 в WhatsApp');
});

it('sends Chinese visitors to the card contact block instead of WhatsApp', () => {
  renderCard('zh');
  const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
  expect(links.some((h) => h?.startsWith('https://wa.me/'))).toBe(false);
  expect(links).toContain('/zh/leads/QN-99#contact');
});

it('uses the translated fact list and marks untranslated text as Russian', () => {
  renderCard('en');
  expect(screen.getByText('gold up to 9.9 g/t')).toBeInTheDocument();
  expect(
    screen.getByText('In the other samples — no more than 1.0 g/t')
  ).toBeInTheDocument();
  const rights = screen.getByText(/наша проверка по карте/);
  expect(rights.closest('[lang="ru"]')).not.toBeNull();
});

it('renders the first scan unmodified with reserved size and cache key', () => {
  renderCard();
  const img = screen.getByAltText('Фрагмент архивного отчёта, названия скрыты');
  expect(img.getAttribute('src')).toBe(
    `${fakeShowcase.images[0].url}?v=aaaaaaaaaaaa`
  );
  expect(img).toHaveAttribute('width', '1200');
  expect(img).toHaveAttribute('height', '300');
  expect(screen.getAllByRole('img', { name: /Фрагмент/ })).toHaveLength(1);
});

it('draws a single circle on the mini map and links to the card page', () => {
  const { container } = renderCard();
  expect(container.querySelectorAll('[data-zone]')).toHaveLength(1);
  expect(screen.getByRole('link', { name: /Подробнее/ })).toHaveAttribute(
    'href',
    '/ru/leads/QN-99'
  );
});

it('gives each card a heading for its metals', () => {
  renderCard();
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
    'Золото, медь'
  );
});
