jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
import { render, screen } from '@testing-library/react';
import PortalWelcomeHero from '@/components/features/PortalWelcomeHero';

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
