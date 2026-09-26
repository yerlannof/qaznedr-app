import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import MobileTabBar from '@/components/layouts/MobileTabBar';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

const setPath = (path: string) =>
  (usePathname as jest.Mock).mockReturnValue(path);

describe('MobileTabBar', () => {
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

  it.each(['/en/contact', '/ru/admin', '/ru/auth/signin', '/en/dashboard'])(
    'is hidden on %s',
    (path) => {
      setPath(path);
      const { container } = render(<MobileTabBar />);
      expect(container).toBeEmptyDOMElement();
    }
  );
});
