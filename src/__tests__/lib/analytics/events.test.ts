import { track } from '@vercel/analytics';
import { safeTrack } from '@/lib/analytics/events';

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
