import { fireEvent, render, screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Navigation from '@/components/layouts/Navigation';

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
});
