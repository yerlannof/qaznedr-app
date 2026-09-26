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

it('keeps a blocked key blocked when the map overflows its default bound', () => {
  let now = 0;
  const allow = createThrottle({ limit: 1, windowMs: 1000, now: () => now });
  for (let i = 0; i < 5000; i++) allow(`spray${i}`);
  now = 500;
  expect(allow('x')).toBe(true);
  expect(allow('x')).toBe(false);
  now = 1200; // the sprayed keys expired; x is still inside its window
  expect(allow('new')).toBe(true); // overflow → prune
  expect(allow('x')).toBe(false);
});

it('evicts the least recently used keys when nothing has expired', () => {
  const allow = createThrottle({
    limit: 1,
    windowMs: 1000,
    maxKeys: 3,
    now: () => 0,
  });
  expect(allow('k0')).toBe(true);
  expect(allow('k1')).toBe(true);
  expect(allow('k2')).toBe(true);
  expect(allow('k3')).toBe(true); // 4 keys > 3 → k0 goes
  expect(allow('k3')).toBe(false); // newest stays tracked
  expect(allow('k0')).toBe(true); // k0 was forgotten, starts over
});
