jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
import { render, screen } from '@testing-library/react';
import PortalWelcomeHero from '@/components/features/PortalWelcomeHero';
import { translate } from '@/lib/i18n/translations';

it('keeps Kazakh counts stable even when the browser falls back to English ICU formatting', () => {
  const fallback = jest.spyOn(Intl, 'NumberFormat').mockImplementation(
    () =>
      ({
        format: (n: number) => (n === 7152 ? '7,152' : String(n)),
      }) as Intl.NumberFormat
  );
  try {
    render(<PortalWelcomeHero locale="kz" stats={{ total: 31, regions: 9 }} />);
    expect(screen.getByText('7 152')).toBeInTheDocument();
  } finally {
    fallback.mockRestore();
  }
});

jest.mock('@/lib/config/contacts', () => ({
  ...jest.requireActual('@/lib/config/contacts'),
  getContactConfig: jest.fn(() => ({
    whatsappNumber: '77001234567',
    wechatId: 'qaznedr',
    wechatQrSrc: null,
    email: null,
  })),
}));

it.each(['ru', 'kz', 'en', 'zh'])(
  'puts area selection first while keeping the %s discussion channel',
  (locale) => {
    render(<PortalWelcomeHero locale={locale} stats={null} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', `/${locale}/leads`);
    expect(links[0]).toHaveClass('brand-button');
    expect(links[1]).toHaveClass('brand-button-secondary');
    expect(links[1]).toHaveAttribute(
      'href',
      locale === 'zh'
        ? '/zh/contact'
        : expect.stringContaining('https://wa.me/77001234567')
    );
    expect(screen.getByText(/50/)).toBeInTheDocument();
  }
);

it('renders the approved Chinese headline without spaces between fragments', () => {
  render(<PortalWelcomeHero locale="zh" stats={null} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    '面向投资者的哈萨克斯坦矿区'
  );
});

it('shows no area or region counts while the showcase is empty', () => {
  render(<PortalWelcomeHero locale="ru" stats={{ total: 0, regions: 0 }} />);
  expect(
    screen.getByText('Рудных объектов в нашем реестре')
  ).toBeInTheDocument();
  expect(screen.queryByText('Участков на витрине')).not.toBeInTheDocument();
  expect(screen.queryByText('Областей Казахстана')).not.toBeInTheDocument();
});

it.each(['ru', 'kz', 'en', 'zh'])(
  'keeps %s copy and CTA ahead of the decorative hero art on a chalk section',
  (locale) => {
    const { container } = render(
      <PortalWelcomeHero locale={locale} stats={null} />
    );
    const hero = container.querySelector('section');
    expect(hero).toHaveClass('brand-hero-chalk');
    const heading = screen.getByRole('heading', { level: 1 });
    const art = hero?.querySelector(
      'img[src*="archive-to-field-chalk-1536.webp"]'
    );
    expect(art).toHaveAttribute('alt', '');
    expect(heading.compareDocumentPosition(art!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(
      screen.getByRole('link', {
        name: new RegExp(translate(locale, 'portal.ctaLeads')),
      })
    ).toHaveAttribute('href', `/${locale}/leads`);
    expect(hero?.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  }
);
