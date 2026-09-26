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
