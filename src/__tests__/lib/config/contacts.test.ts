import {
  hasAnyChannel,
  normalizeContactConfig,
  primaryContactCta,
  whatsappLink,
} from '@/lib/config/contacts';

describe('contacts config', () => {
  it('keeps only digits in the WhatsApp number and nulls empty values', () => {
    expect(
      normalizeContactConfig({
        whatsapp: '+7 (700) 123-45-67',
        wechatId: '   ',
        wechatQr: '/contacts/wechat-qr.png',
        email: undefined,
      })
    ).toEqual({
      whatsappNumber: '77001234567',
      wechatId: null,
      wechatQrSrc: '/contacts/wechat-qr.png',
      email: null,
    });
  });

  it('treats a number without digits as missing', () => {
    expect(normalizeContactConfig({ whatsapp: '+' }).whatsappNumber).toBeNull();
  });

  it('builds a wa.me link with an encoded prefilled message', () => {
    expect(whatsappLink('77001234567', 'Участок AU-1')).toBe(
      `https://wa.me/77001234567?text=${encodeURIComponent('Участок AU-1')}`
    );
  });
});

const full = normalizeContactConfig({
  whatsapp: '+7 747 554 0189',
  wechatQr: '/contacts/wechat-qr.png',
});
const none = normalizeContactConfig({});
const waOnly = normalizeContactConfig({ whatsapp: '77475540189' });

describe('primaryContactCta', () => {
  it('sends Chinese visitors to the WeChat QR', () => {
    expect(primaryContactCta('zh', full)).toEqual({
      kind: 'wechat',
      href: '/zh/contact',
    });
  });

  it('opens WhatsApp for other locales', () => {
    const cta = primaryContactCta('ru', full);
    expect(cta.kind).toBe('whatsapp');
    expect(cta.href).toMatch(/^https:\/\/wa\.me\/77475540189\?text=/);
  });

  it('falls back to WhatsApp for zh without WeChat, then to the contact page', () => {
    expect(primaryContactCta('zh', waOnly).kind).toBe('whatsapp');
    expect(primaryContactCta('en', none)).toEqual({
      kind: 'contact',
      href: '/en/contact',
    });
  });
});

describe('hasAnyChannel', () => {
  it('is false only when nothing is configured', () => {
    expect(hasAnyChannel(none)).toBe(false);
    expect(hasAnyChannel(waOnly)).toBe(true);
  });
});
