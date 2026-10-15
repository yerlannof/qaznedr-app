'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, Mail } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function MarketplaceSignIn({
  locale,
  googleEnabled,
  emailEnabled,
  callbackUrl,
  fetcher = fetch,
}: {
  locale: string;
  googleEnabled: boolean;
  emailEnabled: boolean;
  /** Same-site path to return to after sign-in. */
  callbackUrl: string;
  fetcher?: typeof fetch;
}) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, `marketplaceSignIn.${key}`, params);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  if (!googleEnabled && !emailEnabled)
    return <p role="status">{t('unavailable')}</p>;

  const requestLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const response = await fetcher('/api/auth/email-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, callbackUrl }),
      });
      if (response.ok) {
        setStatus('sent');
        return;
      }
      setError(
        response.status === 429
          ? t('rateLimited')
          : response.status === 400
            ? t('invalidEmail')
            : t('failed')
      );
    } catch {
      setError(t('failed'));
    }
    setStatus('error');
  };

  return (
    <div className="max-w-md space-y-5">
      <p className="text-sm text-brand-muted">
        {t('consentBefore')}
        <a
          href={`/${locale}/legal/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          {t('consentLink')}
        </a>
        .
      </p>
      {googleEnabled && (
        <button
          type="button"
          className="brand-button brand-focus w-full"
          onClick={() => void signIn('google', { callbackUrl })}
        >
          {t('google')}
        </button>
      )}
      {emailEnabled &&
        (status === 'sent' ? (
          <div
            role="status"
            className="border-l-4 border-brand-accent bg-brand-surface p-4"
          >
            <p>{t('sent', { email })}</p>
            <button
              type="button"
              className="brand-focus mt-3 min-h-11 text-sm font-semibold underline underline-offset-4"
              onClick={() => setStatus('idle')}
            >
              {t('anotherEmail')}
            </button>
          </div>
        ) : (
          <form onSubmit={requestLink} className="space-y-3" noValidate>
            {googleEnabled && (
              <p className="text-sm text-brand-muted">{t('orEmail')}</p>
            )}
            <label className="block text-sm font-semibold">
              {t('emailLabel')}
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="brand-focus mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-surface px-3 text-brand-ink"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              className="brand-button-secondary brand-focus w-full gap-2 disabled:opacity-60"
            >
              {status === 'sending' ? (
                <Loader2 aria-hidden className="animate-spin" size={18} />
              ) : (
                <Mail aria-hidden size={18} />
              )}
              {t('emailButton')}
            </button>
            <p className="text-sm text-brand-muted">{t('emailHint')}</p>
            {error && (
              <p role="alert" className="text-sm font-semibold">
                {error}
              </p>
            )}
          </form>
        ))}
    </div>
  );
}
