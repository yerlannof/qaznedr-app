import { fireEvent, render, screen } from '@testing-library/react';
import GeologicalSupport from '@/components/features/GeologicalSupport';
import { getContactConfig } from '@/lib/config/contacts';
import { safeTrack } from '@/lib/analytics/events';
import { translate } from '@/lib/i18n/translations';
import { GUIDE } from '@/lib/insights/registry';

jest.mock('@/lib/config/contacts', () => ({
  ...jest.requireActual('@/lib/config/contacts'),
  getContactConfig: jest.fn(),
}));
jest.mock('@/lib/analytics/events', () => ({ safeTrack: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getContactConfig).mockReturnValue({
    whatsappNumber: '77000000000',
    wechatId: 'test-team',
    wechatQrSrc: null,
    email: null,
  });
});
it.each(['ru', 'kz', 'en', 'zh'])(
  'renders approved service help and limitations in %s',
  (locale) => {
    render(<GeologicalSupport locale={locale} />);
    for (const key of ['title', 'body', 'inputs', 'limits']) {
      expect(
        screen.getByText(translate(locale, `mapSupport.${key}`))
      ).toBeVisible();
      expect(translate(locale, `mapSupport.${key}`)).not.toBe(
        `mapSupport.${key}`
      );
    }
    expect(
      screen.getByRole('link', { name: translate(locale, 'mapSupport.action') })
    ).toHaveAttribute('href', `/${locale}/contact?service=geology`);
  }
);
it('offers a contextual WhatsApp action and tracks only its known topic', () => {
  render(<GeologicalSupport locale="en" compact />);
  const link = screen.getByRole('link', {
    name: translate('en', 'mapSupport.whatsapp'),
  });
  const url = new URL(link.getAttribute('href')!);
  expect(url.hostname).toBe('wa.me');
  expect(url.searchParams.get('text')).toContain(
    translate('en', 'holdingServices.geology.title')
  );
  link.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(link);
  expect(safeTrack).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'en',
    topic: 'geology',
    place: 'map_support',
  });
});
it('keeps the map guide title and slug in its direct WhatsApp action', () => {
  render(
    <GeologicalSupport locale="en" compact guideSlug={GUIDE.geologicalMap} />
  );
  const link = screen.getByRole('link', {
    name: translate('en', 'mapSupport.whatsapp'),
  });
  expect(
    new URL(link.getAttribute('href')!).searchParams.get('text')
  ).toContain(translate('en', 'insights.links.geologicalMap'));
  link.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(link);
  expect(safeTrack).toHaveBeenCalledWith('click_whatsapp', {
    locale: 'en',
    topic: 'geology',
    guide: GUIDE.geologicalMap,
    place: 'map_support',
  });
});
it('routes Chinese visitors to WeChat with the geology context', () => {
  render(<GeologicalSupport locale="zh" compact />);
  expect(
    screen.getByRole('link', { name: translate('zh', 'mapSupport.wechat') })
  ).toHaveAttribute('href', '/zh/contact?service=geology');
  expect(document.querySelector('a[href^="https://wa.me"]')).toBeNull();
});
it('routes Chinese visitors through contextual contact when only WhatsApp is configured', () => {
  jest.mocked(getContactConfig).mockReturnValue({
    whatsappNumber: '77000000000',
    wechatId: null,
    wechatQrSrc: null,
    email: null,
  });
  render(<GeologicalSupport locale="zh" compact />);
  expect(
    screen.getByRole('link', { name: translate('zh', 'mapSupport.action') })
  ).toHaveAttribute('href', '/zh/contact?service=geology');
  expect(document.querySelector('a[href^="https://wa.me"]')).toBeNull();
});
it('keeps a working contact fallback when no channel is configured', () => {
  jest.mocked(getContactConfig).mockReturnValue({
    whatsappNumber: null,
    wechatId: null,
    wechatQrSrc: null,
    email: null,
  });
  render(<GeologicalSupport locale="ru" compact />);
  expect(
    screen.getByRole('link', { name: translate('ru', 'mapSupport.action') })
  ).toHaveAttribute('href', '/ru/contact?service=geology');
});
