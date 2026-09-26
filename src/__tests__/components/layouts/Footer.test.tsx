import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layouts/Footer';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <span>Theme</span>,
}));

describe('Footer', () => {
  it('keeps the current page when switching language', () => {
    (usePathname as jest.Mock).mockReturnValue('/kz/insights/guide');
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/insights/guide'
    );
    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute(
      'href',
      '/zh/insights/guide'
    );
  });

  it('keeps the approved public navigation links', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru');
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Участки' })).toHaveAttribute(
      'href',
      '/ru/leads'
    );
    expect(screen.getByRole('link', { name: 'Контакты' })).toHaveAttribute(
      'href',
      '/ru/contact'
    );
  });

  it('keeps the approved service topic when changing language on contact', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru/contact');
    render(<Footer serviceTopic="licensing" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/contact?service=licensing'
    );
    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute(
      'href',
      '/zh/contact?service=licensing'
    );
  });

  it('does not append a service topic to an unrelated page', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru/insights');
    render(<Footer serviceTopic="licensing" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/en/insights'
    );
  });
});

it('links to the Instagram profile confirmed by the owner', () => {
  (usePathname as jest.Mock).mockReturnValue('/ru');
  render(<Footer />);
  expect(
    screen.getByRole('link', { name: 'Instagram @qaznedr.kz' })
  ).toHaveAttribute('href', 'https://www.instagram.com/qaznedr.kz/');
});
