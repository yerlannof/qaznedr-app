/**
 * @jest-environment node
 */
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import {
  EmailLinkError,
  emailLinkEnabled,
  renderSignInEmail,
  requestEmailLink,
  safeCallbackPath,
  signInWithEmailToken,
} from '@/lib/auth/email-link';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn(),
  emailDeliveryConfigured: () => Boolean(process.env.RESEND_API_KEY),
}));

const rpc = jest.fn();
const send = sendEmail as jest.Mock;
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const identity = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  email: 'driller@example.com',
  name: null,
  image: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ADMIN_EMAILS;
  delete process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_SECRET = 'test-secret';
  (createServiceClient as jest.Mock).mockResolvedValue({ rpc });
});

describe('emailLinkEnabled', () => {
  it('needs both the identity flag and a Resend key', () => {
    process.env.MARKETPLACE_IDENTITY_ENABLED = 'true';
    delete process.env.RESEND_API_KEY;
    expect(emailLinkEnabled()).toBe(false);
    process.env.RESEND_API_KEY = 're_test';
    expect(emailLinkEnabled()).toBe(true);
    process.env.MARKETPLACE_IDENTITY_ENABLED = 'false';
    expect(emailLinkEnabled()).toBe(false);
  });
});

describe('safeCallbackPath', () => {
  it.each([
    ['/ru/equipment/new?draft=1', '/ru/equipment/new?draft=1'],
    ['https://evil.example/x', '/kz/equipment/my'],
    ['//evil.example/x', '/kz/equipment/my'],
    ['/\\evil.example', '/kz/equipment/my'],
    [undefined, '/kz/equipment/my'],
    ['/' + 'a'.repeat(600), '/kz/equipment/my'],
  ])('%s -> %s', (raw, expected) => {
    expect(safeCallbackPath('kz', raw)).toBe(expected);
  });
});

describe('requestEmailLink', () => {
  it('stores only hashes and mails a fragment link', async () => {
    rpc.mockResolvedValue({ data: 'issued', error: null });
    await expect(
      requestEmailLink({
        email: ' Driller@Example.com ',
        ip: '10.0.0.1',
        locale: 'en',
        callbackPath: '/en/equipment/new',
      })
    ).resolves.toBe('sent');

    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe('issue_marketplace_email_token');
    expect(args.p_email).toBe('driller@example.com');
    expect(args.p_ip_hash).toBe(sha('test-secret:10.0.0.1'));
    expect(args.p_token_hash).toMatch(/^[0-9a-f]{64}$/);

    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('driller@example.com');
    expect(mail.subject).toBe('Sign in to QAZNEDR');
    const link = mail.text.match(/https:\/\/\S+/)[0];
    expect(link).toMatch(
      /^https:\/\/qaznedr\.kz\/en\/auth\/email\?next=%2Fen%2Fequipment%2Fnew#token=[A-Za-z0-9_-]{43}$/
    );
    const token = link.split('#token=')[1];
    expect(sha(token)).toBe(args.p_token_hash);
    expect(mail.html).toContain(link);
  });

  it('does not mail when rate limited', async () => {
    rpc.mockResolvedValue({ data: 'rate_limited', error: null });
    await expect(
      requestEmailLink({
        email: 'a@example.com',
        ip: 'x',
        locale: 'ru',
        callbackPath: '/',
      })
    ).resolves.toBe('rate_limited');
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects malformed addresses before storage', async () => {
    await expect(
      requestEmailLink({
        email: 'nope',
        ip: 'x',
        locale: 'ru',
        callbackPath: '/',
      })
    ).resolves.toBe('invalid');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('answers "sent" for the owner address without issuing anything', async () => {
    process.env.ADMIN_EMAILS = 'owner@example.com';
    await expect(
      requestEmailLink({
        email: 'owner@example.com',
        ip: 'x',
        locale: 'ru',
        callbackPath: '/',
      })
    ).resolves.toBe('sent');
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('fails without mailing when storage errors', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(
      requestEmailLink({
        email: 'a@example.com',
        ip: 'x',
        locale: 'ru',
        callbackPath: '/',
      })
    ).rejects.toThrow('Unable to issue email token');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('signInWithEmailToken', () => {
  const token = 'A'.repeat(43);

  it('consumes the hashed token and returns the identity', async () => {
    rpc.mockResolvedValue({ data: identity, error: null });
    await expect(signInWithEmailToken(token)).resolves.toEqual(identity);
    expect(rpc).toHaveBeenCalledWith('sign_in_with_marketplace_email_token', {
      p_token_hash: sha(token),
    });
  });

  it('maps a Google conflict to GOOGLE_ACCOUNT', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
    await expect(signInWithEmailToken(token)).rejects.toEqual(
      new EmailLinkError('GOOGLE_ACCOUNT')
    );
  });

  it('maps everything else to INVALID_LINK', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023' } });
    await expect(signInWithEmailToken(token)).rejects.toMatchObject({
      reason: 'INVALID_LINK',
    });
    await expect(signInWithEmailToken('short')).rejects.toMatchObject({
      reason: 'INVALID_LINK',
    });
  });

  it('never signs in the owner address', async () => {
    process.env.ADMIN_EMAILS = identity.email;
    rpc.mockResolvedValue({ data: identity, error: null });
    await expect(signInWithEmailToken(token)).rejects.toMatchObject({
      reason: 'INVALID_LINK',
    });
  });
});

it('escapes the link in the HTML body', () => {
  const { html } = renderSignInEmail('ru', 'https://qaznedr.kz/?a="b"&c');
  expect(html).toContain('href="https://qaznedr.kz/?a=&quot;b&quot;&amp;c"');
  expect(html).toContain('Войти');
});
