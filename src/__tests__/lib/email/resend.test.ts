/**
 * @jest-environment node
 */
import { sendEmail } from '@/lib/email/resend';

const message = {
  to: 'a@example.com',
  subject: 'S',
  html: '<p>h</p>',
  text: 't',
};

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test';
  delete process.env.EMAIL_FROM;
});

it('posts to Resend with the default sender', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  await sendEmail(message, fetcher as unknown as typeof fetch);
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  expect(init.headers.Authorization).toBe('Bearer re_test');
  expect(JSON.parse(init.body)).toEqual({
    from: 'QAZNEDR <noreply@qaznedr.kz>',
    to: ['a@example.com'],
    subject: 'S',
    html: '<p>h</p>',
    text: 't',
  });
});

it('throws without echoing the provider body', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 422 });
  await expect(
    sendEmail(message, fetcher as unknown as typeof fetch)
  ).rejects.toThrow('Email delivery failed (422)');
});

it('refuses to send without a key', async () => {
  delete process.env.RESEND_API_KEY;
  await expect(sendEmail(message, jest.fn())).rejects.toThrow('not configured');
});
