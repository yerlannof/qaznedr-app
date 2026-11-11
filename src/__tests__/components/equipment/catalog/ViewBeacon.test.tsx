import { render } from '@testing-library/react';
import ViewBeacon from '@/components/equipment/catalog/ViewBeacon';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
let fetchMock: jest.Mock;

beforeEach(() => {
  sessionStorage.clear();
  fetchMock = jest.fn().mockResolvedValue({ ok: true });
  global.fetch = fetchMock as unknown as typeof fetch;
  Object.defineProperty(window.navigator, 'webdriver', {
    configurable: true,
    get: () => false,
  });
});

afterEach(() => jest.restoreAllMocks());

it('counts a listing view once per browser session', () => {
  const first = render(<ViewBeacon listingId={A} />);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/equipment-catalog/${A}/event`,
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ kind: 'view' }),
      keepalive: true,
    })
  );
  first.unmount();
  // Reload / back navigation in the same tab session.
  render(<ViewBeacon listingId={A} />);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // Another listing is its own view.
  render(<ViewBeacon listingId={B} />);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('skips automated browsers', () => {
  Object.defineProperty(window.navigator, 'webdriver', {
    configurable: true,
    get: () => true,
  });
  render(<ViewBeacon listingId={A} />);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('still counts when session storage is unavailable', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  render(<ViewBeacon listingId={A} />);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('never throws when the network fails', () => {
  fetchMock.mockRejectedValue(new Error('offline'));
  expect(() => render(<ViewBeacon listingId={A} />)).not.toThrow();
});
