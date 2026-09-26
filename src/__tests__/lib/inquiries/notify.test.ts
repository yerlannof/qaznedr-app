import { inquirySchema } from '@/lib/inquiries/schema';
import { formatInquiryMessage, notifyTelegram } from '@/lib/inquiries/notify';

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
