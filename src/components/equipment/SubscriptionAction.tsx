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
    <section className="brand-container grid max-w-2xl gap-4 pb-16 pt-10 md:pt-14">
      <h1 className="text-[32px] font-light leading-[1.04] tracking-[-0.025em] sm:text-[40px] lg:text-[48px]">
        {t('pageTitle')}
      </h1>
      <div className="mt-4 grid max-w-md gap-3.5 bg-brand-surface p-[22px]">
        {result === 'invalid' ? (
          <p
            role="alert"
            className="border-l-2 border-brand-bad pl-3 text-[15px]"
          >
            {t('linkInvalid')}
          </p>
        ) : result === 'done' ? (
          <p
            role="status"
            className="border-l-2 border-brand-ok pl-3 text-[15px]"
          >
            {t(action === 'confirm' ? 'confirmed' : 'unsubscribed')}
          </p>
        ) : (
          action && (
            <button
              type="button"
              onClick={() => void run()}
              className={`${action === 'confirm' ? 'brand-button' : 'brand-button-secondary'} brand-focus w-full`}
            >
              {t(action === 'confirm' ? 'confirmButton' : 'unsubscribeButton')}
            </button>
          )
        )}
        <Link
          href={`/${locale}/equipment`}
          className="brand-focus inline-flex min-h-11 items-center justify-self-start text-[15px] underline decoration-brand-line underline-offset-4"
        >
          {translate(locale, 'equipmentCatalog.backToCatalog')}
        </Link>
      </div>
    </section>
  );
}
