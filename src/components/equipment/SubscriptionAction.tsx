'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { translate } from '@/lib/i18n/translations';

type Action = 'confirm' | 'unsubscribe';

/** Confirms or cancels a subscription from the e-mail link, on a button press. */
export default function SubscriptionAction({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, `equipmentSubscribe.${key}`);
  const [action, setAction] = useState<Action | null>(null);
  const [token, setToken] = useState('');
  const [result, setResult] = useState<'done' | 'invalid' | null>(null);
  const read = useRef(false);

  useEffect(() => {
    if (read.current) return;
    read.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
    const confirm = params.get('confirm');
    const stop = params.get('unsubscribe');
    if (confirm) {
      setAction('confirm');
      setToken(confirm);
    } else if (stop) {
      setAction('unsubscribe');
      setToken(stop);
    } else setResult('invalid');
  }, []);

  const run = async () => {
    if (!action) return;
    const res = await fetch(`/api/equipment-subscriptions/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    setResult(res?.ok ? 'done' : 'invalid');
  };

  return (
    <section className="brand-container max-w-2xl py-16">
      <h1 className="holding-title">{t('pageTitle')}</h1>
      {result === 'invalid' ? (
        <p role="alert" className="mt-4">
          {t('linkInvalid')}
        </p>
      ) : result === 'done' ? (
        <p role="status" className="mt-4">
          {t(action === 'confirm' ? 'confirmed' : 'unsubscribed')}
        </p>
      ) : (
        action && (
          <button
            type="button"
            onClick={() => void run()}
            className="brand-button brand-focus mt-8"
          >
            {t(action === 'confirm' ? 'confirmButton' : 'unsubscribeButton')}
          </button>
        )
      )}
      <Link
        href={`/${locale}/equipment`}
        className="brand-focus mt-8 block underline"
      >
        {translate(locale, 'equipmentCatalog.backToCatalog')}
      </Link>
    </section>
  );
}
