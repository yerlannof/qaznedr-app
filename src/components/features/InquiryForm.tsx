'use client';

import { useRef, useState } from 'react';
import { safeTrack } from '@/lib/analytics/events';
import { readAttribution } from '@/lib/analytics/attribution';
import { CheckCircle2 } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { INQUIRY_CHANNELS, type InquiryChannel } from '@/lib/inquiries/schema';
import type { ServiceTopic } from '@/lib/services/topics';

interface InquiryFormProps {
  locale: string;
  leadCode?: string;
  serviceTopic?: ServiceTopic;
  initialMessage?: string;
}

type State = 'idle' | 'sending' | 'done' | 'error' | 'rate' | 'invalid';

const CHANNEL_KEYS: Record<InquiryChannel, string> = {
  wechat: 'inquiry.channelWechat',
  whatsapp: 'inquiry.channelWhatsapp',
  email: 'inquiry.channelEmail',
  phone: 'inquiry.channelPhone',
  telegram: 'inquiry.channelTelegram',
};

const input =
  'brand-focus w-full min-h-11 border border-brand-line bg-brand-surface px-3 py-2 text-sm text-brand-ink';
const label = 'mb-1 block text-xs font-medium text-brand-muted';

export default function InquiryForm({
  locale,
  leadCode,
  serviceTopic,
  initialMessage = '',
}: InquiryFormProps) {
  const t = (key: string) => translate(locale, key);
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<State>('idle');
  const [channel, setChannel] = useState<InquiryChannel>(
    locale === 'zh' ? 'wechat' : 'whatsapp'
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          company: form.get('company'),
          country: form.get('country'),
          channel,
          contact: form.get('contact'),
          message: form.get('message'),
          leadCode,
          locale,
          sourcePath: window.location.pathname,
          utm: readAttribution(
            window.location.pathname,
            window.location.search
          ),
          website: form.get('website') ?? '',
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      if (res.status === 429) return setState('rate');
      if (res.status === 400) return setState('invalid');
      const json = await res.json();
      if (!json.success) return setState('error');
      safeTrack('inquiry_submit', {
        lead: leadCode ?? '',
        channel,
        locale,
        topic: serviceTopic,
      });
      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-3 border border-brand-line bg-brand-surface p-4">
        <CheckCircle2 aria-hidden className="w-5 h-5 mt-0.5 text-brand-ink" />
        <div>
          <p className="text-sm font-semibold text-brand-ink">
            {t('inquiry.successTitle')}
          </p>
          <p className="text-sm text-brand-muted">{t('inquiry.successText')}</p>
        </div>
      </div>
    );
  }

  const errorText =
    state === 'rate'
      ? t('inquiry.rateLimited')
      : state === 'invalid'
        ? t('inquiry.invalid')
        : state === 'error'
          ? t('inquiry.error')
          : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="inq-name" className={label}>
          {t('inquiry.nameLabel')}
        </label>
        <input
          id="inq-name"
          name="name"
          required
          maxLength={120}
          className={input}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inq-company" className={label}>
            {t('inquiry.companyLabel')} {t('inquiry.optional')}
          </label>
          <input
            id="inq-company"
            name="company"
            maxLength={160}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="inq-country" className={label}>
            {t('inquiry.countryLabel')} {t('inquiry.optional')}
          </label>
          <input
            id="inq-country"
            name="country"
            maxLength={80}
            className={input}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inq-channel" className={label}>
            {t('inquiry.channelLabel')}
          </label>
          <select
            id="inq-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as InquiryChannel)}
            className={input}
          >
            {INQUIRY_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {t(CHANNEL_KEYS[c])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inq-contact" className={label}>
            {t('inquiry.contactLabel')}
          </label>
          <input
            id="inq-contact"
            name="contact"
            required
            minLength={3}
            maxLength={160}
            className={input}
          />
        </div>
      </div>
      <div>
        <label htmlFor="inq-message" className={label}>
          {t('inquiry.messageLabel')} {t('inquiry.optional')}
        </label>
        <textarea
          id="inq-message"
          name="message"
          defaultValue={initialMessage}
          rows={3}
          maxLength={2000}
          placeholder={t('inquiry.messagePlaceholder')}
          className={`${input} resize-y`}
        />
      </div>
      {/* Honeypot — hidden from people and assistive tech */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      >
        <label htmlFor="inq-website">Website</label>
        <input
          id="inq-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {errorText && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="brand-button brand-focus w-full disabled:opacity-60"
      >
        {state === 'sending' ? t('inquiry.sending') : t('inquiry.submit')}
      </button>
    </form>
  );
}
