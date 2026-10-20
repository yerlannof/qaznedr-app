'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, LogIn, Mail } from 'lucide-react';
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
    return (
      <p
        role="status"
        className="max-w-md bg-brand-surface p-[22px] text-[15px]"
      >
        {t('unavailable')}
      </p>
    );

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

  const consent = (
    <p className="text-[13px] text-brand-muted">
      {t('consentBefore')}
      <a
        href={`/${locale}/legal/privacy`}
        target="_blank"
        rel="noopener noreferrer"
        className="brand-focus underline underline-offset-4"
      >
        {t('consentLink')}
      </a>
      .
    </p>
  );

  return (
    <div className="grid max-w-md gap-3.5 bg-brand-surface p-[22px]">
      {googleEnabled && (
        <button
          type="button"
          className="brand-button-secondary brand-focus w-full bg-brand-bg"
          onClick={() => void signIn('google', { callbackUrl })}
        >
          <LogIn aria-hidden className="size-[18px]" strokeWidth={1.6} />
          {t('google')}
        </button>
      )}
      {emailEnabled &&
        (status === 'sent' ? (
          <div role="status" className="grid gap-3.5">
            <span
              aria-hidden
              className="grid size-11 place-items-center rounded-full bg-brand-accent text-brand-slate"
            >
              <Mail className="size-[22px]" strokeWidth={1.6} />
            </span>
            <p className="text-[15px]">{t('sent', { email })}</p>
            <button
              type="button"
              className="brand-focus inline-flex min-h-11 items-center justify-self-start text-[15px] underline decoration-brand-line underline-offset-4"
              onClick={() => setStatus('idle')}
            >
              {t('anotherEmail')}
            </button>
          </div>
        ) : (
          <form onSubmit={requestLink} className="grid gap-3.5" noValidate>
            {googleEnabled && (
              <p className="flex items-center gap-3 text-[13px] text-brand-muted before:h-px before:flex-1 before:bg-brand-hair before:content-[''] after:h-px after:flex-1 after:bg-brand-hair after:content-['']">
                {t('orEmail')}
              </p>
            )}
            <label className="grid gap-1.5 text-[13px] font-medium">
              {t('emailLabel')}
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                placeholder="name@mail.kz"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="brand-focus min-h-12 w-full rounded-none border border-brand-line bg-brand-bg px-3.5 text-base font-normal text-brand-ink"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              className="brand-button-secondary brand-focus w-full disabled:opacity-60"
            >
              {status === 'sending' ? (
                <Loader2 aria-hidden className="size-[18px] animate-spin" />
              ) : (
                <Mail aria-hidden className="size-[18px]" strokeWidth={1.6} />
              )}
              {t('emailButton')}
            </button>
            <p className="text-[13px] text-brand-muted">{t('emailHint')}</p>
            {error && (
              <p role="alert" className="text-sm font-medium text-brand-bad">
                {error}
              </p>
            )}
          </form>
        ))}
      {consent}
    </div>
  );
}
