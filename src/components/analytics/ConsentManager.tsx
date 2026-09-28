'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { translate } from '@/lib/i18n/translations';
import { isPublicPath } from '@/lib/analytics/attribution';
import {
  CONSENT_TTL_MS,
  readConsent,
  writeConsent,
  type ConsentChoice,
} from '@/lib/analytics/consent';
import { revokeProviders, syncProviders } from '@/lib/analytics/providers';
import { OPEN_CONSENT_SETTINGS } from '@/components/analytics/ConsentSettingsButton';

export default function ConsentManager({ locale }: { locale: string }) {
  const pathname = usePathname() || '';
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const analyticsCheckbox = useRef<HTMLInputElement>(null);
  const t = (key: string) => translate(locale, `consent.${key}`);

  useEffect(() => {
    const current = readConsent();
    setChoice(current);
    setReady(true);
    syncProviders(pathname, current?.analytics === true);
  }, [pathname]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'qaznedr_consent') return;
      const current = readConsent();
      setChoice(current);
      if (!current?.analytics) revokeProviders();
      syncProviders(pathname, current?.analytics === true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname]);

  useEffect(() => {
    if (!choice) return;
    let timer: number | undefined;
    const recheck = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const current = readConsent();
      if (!current) {
        setChoice(null);
        revokeProviders();
        return;
      }
      const remaining = current.decidedAt + CONSENT_TTL_MS - Date.now();
      timer = window.setTimeout(
        recheck,
        Math.min(remaining, 24 * 60 * 60 * 1000)
      );
    };
    timer = window.setTimeout(
      recheck,
      Math.min(
        choice.decidedAt + CONSENT_TTL_MS - Date.now(),
        24 * 60 * 60 * 1000
      )
    );
    document.addEventListener('visibilitychange', recheck);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [choice?.decidedAt]);

  const openSettings = () => {
    trigger.current = document.activeElement as HTMLElement | null;
    setAnalyticsSelected(choice?.analytics === true);
    setSettingsOpen(true);
  };

  useEffect(() => {
    document.addEventListener(OPEN_CONSENT_SETTINGS, openSettings);
    return () =>
      document.removeEventListener(OPEN_CONSENT_SETTINGS, openSettings);
  });

  useEffect(() => {
    if (settingsOpen) analyticsCheckbox.current?.focus();
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen || !restoreFocus.current) return;
    restoreFocus.current = false;
    const target = trigger.current?.isConnected
      ? trigger.current
      : document.querySelector<HTMLElement>('[data-consent-settings-button]');
    target?.focus();
  }, [settingsOpen, choice]);

  const closeSettings = () => {
    restoreFocus.current = true;
    setSettingsOpen(false);
  };

  const decide = (analytics: boolean) => {
    const next = writeConsent(analytics);
    setChoice(next);
    if (analytics) syncProviders(pathname, true);
    else revokeProviders();
    if (settingsOpen) closeSettings();
    else setSettingsOpen(false);
  };

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSettings();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled)'
      ) || []
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!ready || !isPublicPath(pathname)) return null;
  return (
    <>
      {settingsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-ink/70 p-3 sm:items-center"
          role="presentation"
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-dialog-title"
            onKeyDown={onDialogKeyDown}
            className="max-h-[calc(100dvh-24px)] w-full max-w-[540px] overflow-y-auto border border-brand-line bg-brand-surface p-5 text-brand-ink sm:p-6"
          >
            <h2
              id="consent-dialog-title"
              className="font-serif text-2xl leading-tight"
            >
              {t('title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              {t('settingsLead')}
            </p>
            <label className="mt-5 grid grid-cols-[1fr_auto] gap-3 border-t border-brand-line py-4">
              <span>
                <strong className="block text-sm">{t('analytics')}</strong>
                <span className="mt-1 block text-sm leading-relaxed text-brand-muted">
                  {t('analyticsText')}
                </span>
              </span>
              <input
                ref={analyticsCheckbox}
                type="checkbox"
                checked={analyticsSelected}
                onChange={(e) => setAnalyticsSelected(e.target.checked)}
                className="brand-focus mt-1 size-6 accent-brand-ink"
              />
            </label>
            <label className="grid grid-cols-[1fr_auto] gap-3 border-t border-brand-line py-4">
              <span>
                <strong className="block text-sm">{t('advertising')}</strong>
                <span className="mt-1 block text-sm leading-relaxed text-brand-muted">
                  {t('advertisingText')}
                </span>
              </span>
              <input
                type="checkbox"
                disabled
                checked={false}
                readOnly
                className="mt-1 size-6"
              />
            </label>
            <p className="mb-4 text-xs leading-relaxed text-brand-muted">
              {t('note')}
            </p>
            <button
              type="button"
              onClick={() => decide(analyticsSelected)}
              className="brand-focus min-h-12 w-full border border-brand-ink bg-brand-ink px-5 text-sm font-semibold text-brand-bg"
            >
              {t('save')}
            </button>
            <button
              type="button"
              onClick={closeSettings}
              className="brand-focus mt-2 min-h-11 text-sm text-brand-ink underline underline-offset-4"
            >
              {t('back')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
