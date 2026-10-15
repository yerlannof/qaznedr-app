import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { isEnvAdminEmail } from '@/lib/auth/env-admin';
import type { MarketplaceIdentity } from '@/lib/auth/marketplace-identity';
import { renderEmailLayout } from '@/lib/email/layout';
import { emailDeliveryConfigured, sendEmail } from '@/lib/email/resend';
import { translate } from '@/lib/i18n/translations';
import { SITE_URL, toLocale } from '@/lib/seo/site';
import { createServiceClient } from '@/lib/supabase/server';

export const EMAIL_LINK_PROVIDER = 'email-link';
export type EmailLinkRequestResult = 'sent' | 'rate_limited' | 'invalid';
export type EmailLinkFailure = 'INVALID_LINK' | 'GOOGLE_ACCOUNT';

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const identitySchema = z.strictObject({
  id: z.string().uuid(),
  email: z.string().email().max(254),
  name: z.string().max(200).nullable(),
  image: z.string().max(2048).nullable(),
});

export function emailLinkEnabled(): boolean {
  return (
    process.env.MARKETPLACE_IDENTITY_ENABLED === 'true' &&
    emailDeliveryConfigured()
  );
}

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** Same-site relative path only; anything else falls back to the cabinet. */
export function safeCallbackPath(locale: string, raw: unknown): string {
  const fallback = `/${toLocale(locale)}/equipment/my`;
  if (typeof raw !== 'string' || raw.length > 512) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\'))
    return fallback;
  try {
    const parsed = new URL(raw, SITE_URL);
    if (parsed.origin !== SITE_URL) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

export function renderSignInEmail(locale: string, link: string) {
  const t = (key: string) => translate(locale, `marketplaceSignIn.${key}`);
  return {
    subject: t('mailSubject'),
    ...renderEmailLayout({
      lang: toLocale(locale),
      paragraphs: [t('mailIntro')],
      button: { label: t('mailButton'), href: link },
      footnotes: [t('mailExpiry'), t('mailIgnore')],
    }),
  };
}

export async function requestEmailLink(input: {
  email: unknown;
  ip: string;
  locale: string;
  callbackPath: unknown;
}): Promise<EmailLinkRequestResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return 'invalid';
  const email = parsed.data;
  const locale = toLocale(input.locale);
  // The owner signs in with the env credential; answer as if sent.
  if (isEnvAdminEmail(email)) return 'sent';

  const token = randomBytes(32).toString('base64url');
  const secret = process.env.NEXTAUTH_SECRET || '';
  const client = await createServiceClient();
  const { data, error } = await client.rpc(
    'issue_marketplace_email_token' as never,
    {
      p_email: email,
      p_token_hash: sha256(token),
      p_ip_hash: sha256(`${secret}:${input.ip}`),
    } as never
  );
  if (error) throw new Error('Unable to issue email token');
  if (data === 'rate_limited') return 'rate_limited';

  const base = new URL(process.env.NEXTAUTH_URL || SITE_URL).origin;
  const next = encodeURIComponent(safeCallbackPath(locale, input.callbackPath));
  // The token sits in the fragment so it never reaches server or proxy logs.
  const link = `${base}/${locale}/auth/email?next=${next}#token=${token}`;
  await sendEmail({ to: email, ...renderSignInEmail(locale, link) });
  return 'sent';
}

export class EmailLinkError extends Error {
  constructor(public readonly reason: EmailLinkFailure) {
    super(reason);
  }
}

export async function signInWithEmailToken(
  token: unknown
): Promise<MarketplaceIdentity> {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) throw new EmailLinkError('INVALID_LINK');
  const client = await createServiceClient();
  const { data, error } = await client.rpc(
    'sign_in_with_marketplace_email_token' as never,
    { p_token_hash: sha256(parsed.data) } as never
  );
  if (error)
    throw new EmailLinkError(
      (error as { code?: string }).code === '23505'
        ? 'GOOGLE_ACCOUNT'
        : 'INVALID_LINK'
    );
  const identity = identitySchema.safeParse(data);
  if (!identity.success || isEnvAdminEmail(identity.data.email))
    throw new EmailLinkError('INVALID_LINK');
  return identity.data;
}
