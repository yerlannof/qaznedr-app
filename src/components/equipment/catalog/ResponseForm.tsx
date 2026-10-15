'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

type Status = 'idle' | 'sending' | 'sent';
const inputClass =
  'brand-focus mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-ink';

/** "Предложить" under a published request: the author receives the contact. */
export default function ResponseForm({
  listingId,
  locale,
  fetcher = fetch,
}: {
  listingId: string;
  locale: string;
  fetcher?: typeof fetch;
}) {
  const t = (key: string) => translate(locale, `equipmentResponses.${key}`);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  if (status === 'sent')
    return (
      <p role="status" className="border-l-4 border-brand-accent p-3">
        {t('sent')}
      </p>
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const response = await fetcher(
        `/api/equipment-catalog/${listingId}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (response.ok) {
        setStatus('sent');
        return;
      }
      setError(
        t(
          response.status === 429
            ? 'rateLimited'
            : response.status === 400
              ? 'invalid'
              : 'failed'
        )
      );
    } catch {
      setError(t('failed'));
    }
    setStatus('idle');
  };
  const field = (name: keyof typeof form, type = 'text') => (
    <label className="block text-sm font-semibold">
      {t(name)}
      {name === 'message' ? (
        <textarea
          required
          maxLength={2000}
          rows={3}
          placeholder={t('messagePlaceholder')}
          className={inputClass}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      ) : (
        <input
          required
          type={type}
          inputMode={type === 'tel' ? 'tel' : undefined}
          autoComplete={type === 'tel' ? 'tel' : 'name'}
          maxLength={name === 'phone' ? 40 : 120}
          placeholder={name === 'phone' ? '8 701 123 45 67' : undefined}
          className={inputClass}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      )}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-semibold">{t('title')}</h2>
      <p className="text-sm text-brand-muted">{t('text')}</p>
      {field('name')}
      {field('phone', 'tel')}
      {field('message')}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="brand-button brand-focus w-full justify-center gap-2"
      >
        {status === 'sending' ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Send aria-hidden className="size-4" />
        )}
        {t('submit')}
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold">
          {error}
        </p>
      )}
    </form>
  );
}
