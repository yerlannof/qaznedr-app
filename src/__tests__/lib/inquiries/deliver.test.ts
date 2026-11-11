/** @jest-environment node */
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
jest.mock('@/lib/inquiries/notify', () => ({
  notifyTelegram: jest.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { notifyTelegram } from '@/lib/inquiries/notify';
import { notifyTelegramWithRetry } from '@/lib/inquiries/deliver';

const capture = Sentry.captureException as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('notifyTelegramWithRetry', () => {
  it('sends once when Telegram accepts the first attempt', async () => {
    const send = jest.fn().mockResolvedValue(true);
    const report = jest.fn();
    await expect(
      notifyTelegramWithRetry('hi', { send, report, delayMs: 0 })
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(report).not.toHaveBeenCalled();
  });

  it('retries once after the delay and stays quiet when the retry works', async () => {
    jest.useFakeTimers();
    try {
      const send = jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const report = jest.fn();
      const done = notifyTelegramWithRetry('hi', {
        send,
        report,
        delayMs: 750,
      });
      await jest.advanceTimersByTimeAsync(749);
      expect(send).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await expect(done).resolves.toBe(true);
      expect(send).toHaveBeenCalledTimes(2);
      expect(report).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('reports when both attempts fail, including a thrown send', async () => {
    const send = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('down'));
    const report = jest.fn();
    await expect(
      notifyTelegramWithRetry('hi', {
        send,
        report,
        delayMs: 0,
        context: { inquiryId: 'uuid-1' },
      })
    ).resolves.toBe(false);
    expect(send).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(report.mock.calls[0][1]).toEqual({ inquiryId: 'uuid-1' });
  });

  it('by default sends through notifyTelegram and reports to Sentry without the message text', async () => {
    (notifyTelegram as jest.Mock).mockResolvedValue(false);
    await expect(
      notifyTelegramWithRetry('secret text', {
        delayMs: 0,
        context: { inquiryId: 'uuid-9' },
      })
    ).resolves.toBe(false);
    expect(notifyTelegram).toHaveBeenCalledTimes(2);
    expect((notifyTelegram as jest.Mock).mock.calls[0][0]).toBe('secret text');
    expect(capture).toHaveBeenCalledTimes(1);
    const [error, hint] = capture.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(hint).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'inquiry-notification' }),
        extra: { inquiryId: 'uuid-9' },
      })
    );
    expect(JSON.stringify(capture.mock.calls[0])).not.toContain('secret text');
  });
});
