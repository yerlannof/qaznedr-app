import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layouts/Footer';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <span>Theme</span>,
}));

describe('Footer', () => {
  it('preserves guide context in article contact and contact language links', () => {
    (usePathname as jest.Mock).mockReturnValue(
      `/ru/insights/${GUIDE.geologicalMap}`
    );
    const { rerender } = render(<Footer />);
    expect(screen.getByRole('link', { name: 'Контакты' })).toHaveAttribute(
      'href',
      `/ru/contact?guide=${GUIDE.geologicalMap}`
    );
    (usePathname as jest.Mock).mockReturnValue('/ru/contact');
    rerender(<Footer guideSlug={GUIDE.geologicalMap} />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      `/en/contact?guide=${GUIDE.geologicalMap}`
    );
  });
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

  it('preserves a known guide on service language and contact links', () => {
    (usePathname as jest.Mock).mockReturnValue('/ru/services/geological');
    render(<Footer serviceTopic="geology" guideSlug={GUIDE.geologicalMap} />);
    expect(screen.getByRole('link', { name: 'Контакты' })).toHaveAttribute(
      'href',
      `/ru/contact?service=geology&guide=${GUIDE.geologicalMap}`
    );
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      `/en/services/geological?guide=${GUIDE.geologicalMap}`
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

it('carries the current article into the services footer link', () => {
  (usePathname as jest.Mock).mockReturnValue(
    `/ru/insights/${GUIDE.geologicalMap}`
  );
  render(<Footer />);
  expect(screen.getByRole('link', { name: 'Услуги' })).toHaveAttribute(
    'href',
    `/ru/services?guide=${GUIDE.geologicalMap}`
  );
});
