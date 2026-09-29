import { fireEvent, render, screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Navigation from '@/components/layouts/Navigation';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <span>Theme</span>,
}));

beforeEach(() => {
  (usePathname as jest.Mock).mockReturnValue('/ru/leads/ABC-123');
  (useSession as jest.Mock).mockReturnValue({ data: null });
});

describe('Navigation', () => {
  it('preserves guide context in article contact and contact language links', () => {
    (usePathname as jest.Mock).mockReturnValue(
      `/ru/insights/${GUIDE.geologicalMap}`
    );
    const { rerender } = render(<Navigation />);
    expect(screen.getByRole('link', { name: 'Связаться' })).toHaveAttribute(
      'href',
      `/ru/contact?guide=${GUIDE.geologicalMap}`
    );
    (usePathname as jest.Mock).mockReturnValue('/ru/contact');
    rerender(<Navigation guideSlug={GUIDE.geologicalMap} />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      `/en/contact?guide=${GUIDE.geologicalMap}`
    );
  });
  it('keeps the current path when changing language on desktop and mobile', () => {
    render(<Navigation />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/leads/ABC-123'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    const menu = screen.getByRole('dialog');
    expect(
      within(menu).getByRole('button', { name: 'Закрыть' })
    ).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: '中文' })).toHaveAttribute(
      'href',
      '/zh/leads/ABC-123'
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps admin and logout actions for an authenticated user', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Owner' } },
    });
    render(<Navigation />);
    expect(screen.getByRole('link', { name: 'Админка' })).toHaveAttribute(
      'href',
      '/ru/admin'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/ru' });
  });

  it('keeps an approved service topic when changing language on contact', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru/contact');
    render(<Navigation serviceTopic="geology" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/contact?service=geology'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    expect(
      within(screen.getByRole('dialog')).getByRole('link', { name: '中文' })
    ).toHaveAttribute('href', '/zh/contact?service=geology');
  });

  it('keeps known service context on desktop and mobile contact actions', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru/services/legal');
    render(<Navigation serviceTopic="licensing" />);
    expect(screen.getByRole('link', { name: 'Связаться' })).toHaveAttribute(
      'href',
      '/ru/contact?service=licensing'
    );
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/services/legal'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    expect(
      within(screen.getByRole('dialog')).getByRole('link', {
        name: 'Связаться',
      })
    ).toHaveAttribute('href', '/ru/contact?service=licensing');
  });
});
