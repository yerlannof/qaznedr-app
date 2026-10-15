/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/email-link/route';
import { emailLinkEnabled, requestEmailLink } from '@/lib/auth/email-link';

jest.mock('@/lib/auth/email-link', () => ({
  emailLinkEnabled: jest.fn(),
  requestEmailLink: jest.fn(),
}));

const enabled = emailLinkEnabled as jest.Mock;
const issue = requestEmailLink as jest.Mock;
const post = (
  headers: Record<string, string>,
  body = '{"email":"a@example.com","locale":"kz","callbackUrl":"/kz/equipment/new"}'
) =>
  POST(
    new Request('https://qaznedr.kz/api/auth/email-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://qaznedr.kz',
        ...headers,
      },
      body,
    })
  );

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.NEXTAUTH_URL;
  enabled.mockReturnValue(true);
});

it('is hidden while email sign-in is off', async () => {
  enabled.mockReturnValue(false);
  expect((await post({})).status).toBe(404);
  expect(issue).not.toHaveBeenCalled();
});

it('rejects foreign origins', async () => {
  expect((await post({ origin: 'https://evil.example' })).status).toBe(403);
  expect(issue).not.toHaveBeenCalled();
});

it('passes the client IP and maps results to status codes', async () => {
  issue.mockResolvedValueOnce('sent');
  const ok = await post({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
  expect(ok.status).toBe(200);
  expect(issue).toHaveBeenCalledWith({
    email: 'a@example.com',
    ip: '1.2.3.4',
    locale: 'kz',
    callbackPath: '/kz/equipment/new',
  });
  issue.mockResolvedValueOnce('rate_limited');
  expect((await post({})).status).toBe(429);
  issue.mockResolvedValueOnce('invalid');
  expect((await post({})).status).toBe(400);
  issue.mockRejectedValueOnce(new Error('resend down for a@example.com'));
  const failed = await post({});
  expect(failed.status).toBe(502);
  expect(await failed.text()).not.toContain('a@example.com');
});

it('rejects malformed JSON', async () => {
  expect((await post({}, '{')).status).toBe(400);
});
