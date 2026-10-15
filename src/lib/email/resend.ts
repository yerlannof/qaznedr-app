import 'server-only';

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export const DEFAULT_EMAIL_FROM = 'QAZNEDR <noreply@qaznedr.kz>';

export function emailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sends one transactional e-mail through Resend. Throws on any failure. */
export async function sendEmail(
  message: OutgoingEmail,
  fetcher: typeof fetch = fetch
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Email delivery is not configured');
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  // Never surface the provider body: it can echo the recipient address.
  if (!response.ok)
    throw new Error(`Email delivery failed (${response.status})`);
}
