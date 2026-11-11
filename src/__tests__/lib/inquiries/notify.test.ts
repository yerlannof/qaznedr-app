import { inquirySchema } from '@/lib/inquiries/schema';
import {
  formatInquiryMessage,
  notifyTelegram,
  replyPhoneDigits,
} from '@/lib/inquiries/notify';

const input = inquirySchema.parse({
  name: 'Li Wei',
  company: 'Zijin',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
  sourcePath: '/zh/leads/AU-508A4C',
  elapsedMs: 9000,
});

describe('formatInquiryMessage', () => {
  it('includes the essentials and no "undefined"', () => {
    const msg = formatInquiryMessage(input, 'uuid-1');
    expect(msg).toContain('AU-508A4C');
    expect(msg).toContain('wechat: liwei_88');
    expect(msg).toContain('Zijin');
    expect(msg).toContain('uuid-1');
    expect(msg).not.toContain('undefined');
  });
});

const ADMIN = 'Все заявки: https://qaznedr.kz/ru/admin/inquiries';
const withContact = (channel: string, contact: string) =>
  inquirySchema.parse({
    name: 'Test',
    channel,
    contact,
    locale: 'ru',
    elapsedMs: 9000,
  });

describe('replyPhoneDigits', () => {
  it.each([
    ['8 700 123 45 67', '77001234567'],
    ['+7 (700) 123-45-67', '77001234567'],
    ['77001234567', '77001234567'],
    ['7001234567', '77001234567'],
    ['+86 131 0000 0000', '8613100000000'],
    ['+49 30 1234567', '49301234567'],
  ])('normalises %s to %s', (raw, digits) => {
    expect(replyPhoneDigits(raw)).toBe(digits);
  });

  it.each([
    'name@example.com',
    'liwei_88',
    '@handle',
    '12345',
    '1234567890123456',
    '+7 700 abc 45 67',
  ])('rejects %s', (raw) => {
    expect(replyPhoneDigits(raw)).toBeNull();
  });
});

describe('formatInquiryMessage reply shortcuts', () => {
  it('adds a wa.me link for a WhatsApp phone number, then the admin link', () => {
    const msg = formatInquiryMessage(
      withContact('whatsapp', '8 700 123 45 67'),
      'uuid-2'
    );
    const lines = msg.split('\n');
    expect(lines).toContain('Связь: whatsapp: 8 700 123 45 67');
    expect(lines).toContain('Ответить в WhatsApp: https://wa.me/77001234567');
    expect(
      lines.indexOf('Ответить в WhatsApp: https://wa.me/77001234567')
    ).toBe(lines.indexOf('Связь: whatsapp: 8 700 123 45 67') + 1);
    expect(lines[lines.length - 1]).toBe(ADMIN);
  });

  it('adds no WhatsApp link when the contact is not a phone number', () => {
    const msg = formatInquiryMessage(
      withContact('whatsapp', 'name@example.com'),
      'uuid-3'
    );
    expect(msg).not.toContain('wa.me');
    expect(msg).toContain('Связь: whatsapp: name@example.com');
    expect(msg.endsWith(ADMIN)).toBe(true);
  });

  it('prints a phone contact in +7 form so Telegram makes it tappable', () => {
    const msg = formatInquiryMessage(
      withContact('phone', '8 (700) 123-45-67'),
      'uuid-4'
    );
    expect(msg).toContain('Связь: phone: 8 (700) 123-45-67');
    expect(msg).toContain('Позвонить: +77001234567');
    expect(msg).not.toContain('wa.me');
  });

  it('adds only the admin link for other channels', () => {
    const msg = formatInquiryMessage(input, 'uuid-1');
    expect(msg).not.toContain('wa.me');
    expect(msg).not.toContain('Позвонить');
    expect(msg.endsWith(ADMIN)).toBe(true);
  });

  it('keeps user input literal (plain text, no parse_mode) and on its own line', () => {
    const tricky = inquirySchema.parse({
      name: 'A <b>*x*</b>\nОтветить в WhatsApp: https://wa.me/1',
      channel: 'telegram',
      contact: '@a_b',
      message: 'line1\nline2 <i>_y_</i>',
      locale: 'ru',
      elapsedMs: 9000,
    });
    const msg = formatInquiryMessage(tricky, 'uuid-5');
    // Single-line fields cannot forge an extra line of the notification.
    expect(msg).toContain(
      'Имя: A <b>*x*</b> Ответить в WhatsApp: https://wa.me/1'
    );
    expect(msg.split('\n').filter((l) => l.startsWith('Ответить'))).toEqual([]);
    // Free text keeps its own line breaks.
    expect(msg).toContain('Сообщение: line1\nline2 <i>_y_</i>');
  });
});

describe('notifyTelegram', () => {
  it('does nothing when not configured', async () => {
    const f = jest.fn();
    await expect(
      notifyTelegram('x', { token: undefined, chatId: undefined }, f)
    ).resolves.toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it('posts plain text to the bot API', async () => {
    const f = jest.fn().mockResolvedValue({ ok: true });
    await expect(
      notifyTelegram('hi', { token: 'T', chatId: '42' }, f)
    ).resolves.toBe(true);
    expect(f).toHaveBeenCalledWith(
      'https://api.telegram.org/botT/sendMessage',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      chat_id: '42',
      text: 'hi',
      disable_web_page_preview: true,
    });
  });

  it('gives up when Telegram hangs, so the inquiry response is not blocked', async () => {
    const hang = (_url: string, init: RequestInit) =>
      new Promise<{ ok: boolean }>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(new Error('aborted'))
        );
      });
    await expect(
      notifyTelegram('hi', { token: 'T', chatId: '42' }, hang, 20)
    ).resolves.toBe(false);
  }, 1000);

  it('never throws on network errors', async () => {
    const f = jest.fn().mockRejectedValue(new Error('down'));
    await expect(
      notifyTelegram('hi', { token: 'T', chatId: '42' }, f)
    ).resolves.toBe(false);
  });
});
