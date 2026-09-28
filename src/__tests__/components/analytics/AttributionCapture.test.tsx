import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import AttributionCapture from '@/components/analytics/AttributionCapture';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

it('uses the document referrer only on the first effect, even after attribution expires', () => {
  const originalReferrer = Object.getOwnPropertyDescriptor(
    document,
    'referrer'
  );
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: 'https://www.baidu.com/s?q=gold',
  });
  const now = jest.spyOn(Date, 'now');
  now.mockReturnValue(1000);
  (usePathname as jest.Mock).mockReturnValue('/zh/leads');
  const { rerender, unmount } = render(<AttributionCapture />);
  expect(
    JSON.parse(sessionStorage.getItem('qaznedr_attribution')!).utm
  ).toMatchObject({
    landing_path: '/zh/leads',
    referrer_host: 'www.baidu.com',
  });

  now.mockReturnValue(1000 + 31 * 60 * 1000);
  (usePathname as jest.Mock).mockReturnValue('/zh/contact');
  rerender(<AttributionCapture />);
  expect(
    JSON.parse(sessionStorage.getItem('qaznedr_attribution')!).utm
  ).toEqual({ landing_path: '/zh/contact' });

  now.mockReturnValue(1000 + 62 * 60 * 1000);
  unmount();
  (usePathname as jest.Mock).mockReturnValue('/en/contact');
  render(<AttributionCapture />);
  expect(
    JSON.parse(sessionStorage.getItem('qaznedr_attribution')!).utm
  ).toEqual({ landing_path: '/en/contact' });

  now.mockRestore();
  sessionStorage.clear();
  if (originalReferrer)
    Object.defineProperty(document, 'referrer', originalReferrer);
});
