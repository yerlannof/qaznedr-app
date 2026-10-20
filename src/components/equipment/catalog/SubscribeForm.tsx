'use client';

import { useId, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

/** "Сообщать о новых": e-mail digest for the filters on screen. */
export default function SubscribeForm({
  locale,
  filters,
  fetcher = fetch,
}: {
  locale: string;
  filters: Record<string, string>;
  fetcher?: typeof fetch;
}) {
  const t = (key: string) => translate(locale, `equipmentSubscribe.${key}`);
  const hintId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetcher('/api/equipment-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filters, locale }),
      });
      if (res.ok) {
        setStatus('sent');
        return;
      }
      setError(
        t(
          res.status === 429
            ? 'rateLimited'
            : res.status === 400
              ? 'invalid'
              : 'failed'
        )
      );
    } catch {
      setError(t('failed'));
    }
    setStatus('idle');
  };

  return (
    <section className="mt-14 grid gap-4 bg-brand-surface px-6 py-7 lg:grid-cols-[1fr_460px] lg:items-center lg:p-8">
      <div>
        <h2 className="flex items-center gap-2 text-[22px] font-normal tracking-[-0.015em]">
          <Bell aria-hidden className="size-5 text-brand-accent" />
          {t('title')}
        </h2>
        <p id={hintId} className="mt-1.5 text-[13px] text-brand-muted">
          {t('text')}
        </p>
      </div>
      {status === 'sent' ? (
        <p role="status">{t('sent')}</p>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-2.5 lg:grid-cols-[1fr_auto]"
        >
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            aria-label={translate(locale, 'marketplaceSignIn.emailLabel')}
            aria-describedby={hintId}
            placeholder={t('placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="brand-focus min-h-12 w-full rounded-none border border-brand-line bg-brand-bg px-3.5 text-base text-brand-ink"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="brand-button brand-focus"
          >
            {status === 'sending' && (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            )}
            {t('button')}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold lg:col-span-2">
          {error}
        </p>
      )}
    </section>
  );
}
