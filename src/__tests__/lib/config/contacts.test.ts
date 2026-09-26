import { normalizeContactConfig, whatsappLink } from '@/lib/config/contacts';

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
