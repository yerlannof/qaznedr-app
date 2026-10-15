'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

type Props = {
  locale: string;
  /** Already validated same-site path. */
  next: string;
  navigate?: (url: string) => void;
};

export default function EmailLinkConfirm({
  locale,
  next,
  navigate = (url) => window.location.assign(url),
}: Props) {
  const t = (key: string) => translate(locale, `marketplaceSignIn.${key}`);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const read = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice; the hash is gone after the first read.
    if (read.current) return;
    read.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      'token'
    );
    // Drop the token from the address bar and history right away.
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
    if (value) setToken(value);
    else setError(t('linkInvalid'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A button press (not auto-submit) keeps mail scanners from burning the link.
  const confirm = async () => {
    if (!token) return;
    setBusy(true);
    const result = await signIn('email-link', {
      token,
      redirect: false,
      callbackUrl: next,
    });
    if (result?.ok && !result.error) {
      navigate(next);
      return;
    }
    setBusy(false);
    setToken(null);
    setError(
      result?.error === 'GOOGLE_ACCOUNT' ? t('googleAccount') : t('linkInvalid')
    );
  };

  return (
    <section className="brand-container max-w-2xl py-16">
      <h1 className="holding-title">{t('confirmTitle')}</h1>
      {error ? (
        <>
          <p role="alert" className="mt-4">
            {error}
          </p>
          <Link
            href={`/${locale}/equipment/my`}
            className="brand-button-secondary brand-focus mt-8"
          >
            {t('newLink')}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-4 text-brand-muted">{t('confirmText')}</p>
          <button
            type="button"
            className="brand-button brand-focus mt-8 gap-2"
            disabled={!token || busy}
            onClick={() => void confirm()}
          >
            {busy && <Loader2 aria-hidden className="animate-spin" size={18} />}
            {t('confirmButton')}
          </button>
        </>
      )}
    </section>
  );
}
