'use client';

import { useState } from 'react';
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
    <section className="mt-10 border-l-4 border-brand-accent bg-brand-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Bell aria-hidden className="size-4" />
        {t('title')}
      </h2>
      {status === 'sent' ? (
        <p role="status" className="mt-2">
          {t('sent')}
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-sm font-semibold">
            {t('text')}
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              placeholder={t('placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brand-focus mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-bg px-3 text-brand-ink"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="brand-button-secondary brand-focus gap-2"
          >
            {status === 'sending' && (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            )}
            {t('button')}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}
