import {
  hasAnyChannel,
  normalizeContactConfig,
  primaryContactCta,
  whatsappLink,
} from '@/lib/config/contacts';
import { translate } from '@/lib/i18n/translations';

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

  it('changes only an initial Russian greeting in approved WhatsApp presets', () => {
    const preset =
      'Здравствуйте! Интересует объект QN-A01 на qaznedr.kz. Прошу прислать NDA и материалы.';
    const text = new URL(whatsappLink('77001234567', preset)).searchParams.get(
      'text'
    );
    expect(text).toBe(
      'Ассаляму алейкум! Интересует объект QN-A01 на qaznedr.kz. Прошу прислать NDA и материалы.'
    );
    expect(
      new URL(
        whatsappLink('77001234567', 'Тема: Здравствуйте! NDA')
      ).searchParams.get('text')
    ).toBe('Тема: Здравствуйте! NDA');
    expect(
      new URL(whatsappLink('77001234567', 'Hello! QN-A01')).searchParams.get(
        'text'
      )
    ).toBe('Hello! QN-A01');
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
    expect(new URL(cta.href).searchParams.get('text')).toBe(
      'Ассаляму алейкум! Пишу с сайта qaznedr.kz.'
    );
  });

  it('keeps the prospecting code and district in the Russian prepared message', () => {
    const text = translate('ru', 'prospecting.whatsappText', {
      code: 'P-42',
      district: 'Алматинский район',
    });
    expect(
      new URL(whatsappLink('77475540189', text)).searchParams.get('text')
    ).toBe(
      'Ассаляму алейкум! Хотим работать на старательском участке P-42 (Алматинский район). Нас … человек, все граждане РК, опыт: …'
    );
    expect(translate('en', 'contact.whatsappTextGeneral')).toBe(
      'Hello! I am writing from qaznedr.kz.'
    );
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
