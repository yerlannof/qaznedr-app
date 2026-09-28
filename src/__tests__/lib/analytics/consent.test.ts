import {
  CONSENT_KEY,
  readConsent,
  writeConsent,
} from '@/lib/analytics/consent';

beforeEach(() => localStorage.clear());

it('defaults to no consent and keeps advertising off after analytics opt-in', () => {
  expect(readConsent(1000)).toBeNull();
  expect(writeConsent(true, 1000)).toMatchObject({
    analytics: true,
    advertising: false,
  });
  expect(readConsent(1001)).toMatchObject({
    analytics: true,
    advertising: false,
  });
});

it('expires at 180 days and rejects invalid or obsolete records', () => {
  writeConsent(true, 1000);
  expect(readConsent(1000 + 180 * 24 * 60 * 60 * 1000)).toBeNull();
  localStorage.setItem(CONSENT_KEY, '{bad');
  expect(readConsent(2000)).toBeNull();
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: 0,
      analytics: true,
      advertising: true,
      decidedAt: 1000,
    })
  );
  expect(readConsent(2000)).toBeNull();
});

it('keeps a choice for this document when storage is denied', () => {
  const get = jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new Error('denied');
    });
  const set = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('denied');
    });
  expect(writeConsent(false, 1000).analytics).toBe(false);
  expect(readConsent(1001)?.analytics).toBe(false);
  get.mockRestore();
  set.mockRestore();
});

it('uses a newer in-memory refusal when replacing an old stored opt-in fails', () => {
  writeConsent(true, 1000);
  const set = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('quota');
    });
  writeConsent(false, 2000);
  expect(readConsent(2001)?.analytics).toBe(false);
  set.mockRestore();
});
