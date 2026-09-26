import { createThrottle } from '@/lib/inquiries/throttle';

it('allows `limit` hits per key per window', () => {
  let now = 0;
  const allow = createThrottle({ limit: 2, windowMs: 1000, now: () => now });
  expect(allow('a')).toBe(true);
  expect(allow('a')).toBe(true);
  expect(allow('a')).toBe(false);
  expect(allow('b')).toBe(true);
  now = 1001;
  expect(allow('a')).toBe(true);
});
