import { track } from '@vercel/analytics';
import { safeTrack } from '@/lib/analytics/events';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

beforeEach(() => {
  (track as jest.Mock).mockReset();
  window.history.replaceState(null, '', '/');
});

it('omits unknown context rather than forwarding undefined values', () => {
  safeTrack('click_whatsapp', { locale: 'zh', lead: '', topic: undefined });
  expect(track).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'zh',
    lead: '',
    path: '/',
  });
  expect(Object.keys((track as jest.Mock).mock.calls[0][1])).toEqual([
    'locale',
    'lead',
    'path',
  ]);
});

it('adds the page path without query string or hash to every contact click', () => {
  window.history.replaceState(
    null,
    '',
    '/ru/leads/QN-101?utm_source=x&phone=1#contact'
  );
  safeTrack('click_whatsapp', { locale: 'ru', lead: 'QN-101' });
  expect(track).toHaveBeenLastCalledWith('click_whatsapp', {
    locale: 'ru',
    lead: 'QN-101',
    path: '/ru/leads/QN-101',
  });
  safeTrack('click_email', { locale: 'ru' });
  expect(track).toHaveBeenLastCalledWith('click_email', {
    locale: 'ru',
    path: '/ru/leads/QN-101',
  });
  // Non-click events keep their existing shape.
  safeTrack('inquiry_submit', { locale: 'ru', channel: 'phone' });
  expect(track).toHaveBeenLastCalledWith('inquiry_submit', {
    locale: 'ru',
    channel: 'phone',
  });
});

it('clips a very long path to the analytics property limit', () => {
  window.history.replaceState(null, '', `/ru/${'a'.repeat(400)}`);
  safeTrack('click_whatsapp', { locale: 'ru' });
  const { path } = (track as jest.Mock).mock.calls[0][1];
  expect(path.length).toBeLessThanOrEqual(255);
  expect(path.startsWith('/ru/aaa')).toBe(true);
});

it('absorbs analytics failure', () => {
  (track as jest.Mock).mockImplementation(() => {
    throw new Error('offline');
  });
  expect(() =>
    safeTrack('inquiry_submit', { locale: 'en', channel: 'wechat' })
  ).not.toThrow();
});

it('forwards only a registered guide slug', () => {
  safeTrack('click_whatsapp', {
    locale: 'en',
    guide: GUIDE.geologicalMap,
  });
  expect(track).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'en',
    guide: GUIDE.geologicalMap,
    path: '/',
  });
  safeTrack('click_whatsapp', { locale: 'en', guide: 'private-notes' });
  expect(track).toHaveBeenLastCalledWith('click_whatsapp', {
    locale: 'en',
    path: '/',
  });
});
