import { render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import MobileTabBar from '@/components/layouts/MobileTabBar';
import { GUIDE } from '@/lib/insights/registry';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

beforeEach(() =>
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
);

const setPath = (path: string) =>
  (usePathname as jest.Mock).mockReturnValue(path);

describe('MobileTabBar', () => {
  it('keeps a published article slug in its mobile contact action', () => {
    setPath(`/zh/insights/${GUIDE.geologicalMap}`);
    render(<MobileTabBar />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/zh/contact?guide=${GUIDE.geologicalMap}`
    );
  });
  it('shows one localized contact action without navigation tabs', () => {
    setPath('/zh/leads');
    render(<MobileTabBar />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '联系我们' })).toHaveAttribute(
      'href',
      '/zh/contact'
    );
  });

  it('keeps the teaser context and code', () => {
    setPath('/kz/leads/ABC-123');
    render(<MobileTabBar />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/kz/leads/ABC-123#contact-channels'
    );
  });

  it.each([
    ['/ru/services/legal', '/ru/contact?service=licensing'],
    ['/zh/services/geological', '/zh/contact?service=geology'],
  ])('preserves service context from %s', (path, href) => {
    setPath(path);
    render(<MobileTabBar />);
    expect(screen.getByRole('link')).toHaveAttribute('href', href);
  });

  it('preserves a known guide on the service mobile contact action', () => {
    setPath('/zh/services/geological');
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams(`guide=${GUIDE.geologicalMap}`)
    );
    render(<MobileTabBar />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/zh/contact?service=geology&guide=${GUIDE.geologicalMap}`
    );
  });

  it('renders non-service CTA without reading suspended search params', () => {
    setPath('/en/leads');
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw Promise.resolve();
    });
    expect(renderToStaticMarkup(<MobileTabBar />)).toContain(
      'href="/en/contact"'
    );
  });

  it('renders a queryless service CTA while search params are suspended', () => {
    setPath('/en/services/legal');
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw Promise.resolve();
    });
    expect(renderToStaticMarkup(<MobileTabBar />)).toContain(
      'href="/en/contact?service=licensing"'
    );
  });

  it.each([
    `guide=${GUIDE.geologicalMap}&guide=${GUIDE.geologicalMap}`,
    'guide=private-notes',
  ])('ignores invalid service guide query %s', (query) => {
    setPath('/en/services/legal');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(query));
    render(<MobileTabBar />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/en/contact?service=licensing'
    );
  });

  it.each([
    '/en/contact',
    '/ru/admin',
    '/ru/auth/signin',
    '/en/dashboard',
    '/ru/equipment/new',
    '/zh/equipment/new',
  ])('is hidden on %s', (path) => {
    setPath(path);
    const { container } = render(<MobileTabBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
