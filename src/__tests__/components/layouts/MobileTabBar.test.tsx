import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import MobileTabBar from '@/components/layouts/MobileTabBar';

// jest.setup.js mocks usePathname as a plain function returning '/'.
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

describe('MobileTabBar', () => {
  it('shows holding tabs in the current locale without marketplace entries', () => {
    (usePathname as jest.Mock).mockReturnValue('/zh/leads');
    render(<MobileTabBar />);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/zh', '/zh/leads', '/zh/services', '/zh/contact']);
    expect(screen.getByText('联系我们')).toBeInTheDocument();
  });
});
