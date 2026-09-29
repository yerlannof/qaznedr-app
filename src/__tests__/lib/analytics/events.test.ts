import { track } from '@vercel/analytics';
import { safeTrack } from '@/lib/analytics/events';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));

beforeEach(() => (track as jest.Mock).mockReset());

it('omits unknown context rather than forwarding undefined values', () => {
  safeTrack('click_whatsapp', { locale: 'zh', lead: '', topic: undefined });
  expect(track).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'zh',
    lead: '',
  });
  expect(Object.keys((track as jest.Mock).mock.calls[0][1])).toEqual([
    'locale',
    'lead',
  ]);
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
  });
  safeTrack('click_whatsapp', { locale: 'en', guide: 'private-notes' });
  expect(track).toHaveBeenLastCalledWith('click_whatsapp', { locale: 'en' });
});
