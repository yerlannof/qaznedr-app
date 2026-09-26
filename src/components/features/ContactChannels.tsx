'use client';

import Image from 'next/image';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import type { ServiceTopic } from '@/lib/services/topics';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';

interface ContactChannelsProps {
  config: ContactConfig;
  locale: string;
  leadCode?: string;
  serviceTopic?: ServiceTopic;
}

const card = 'border border-brand-line bg-brand-surface p-5';

export default function ContactChannels({
  config,
  locale,
  leadCode,
  serviceTopic,
}: ContactChannelsProps) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const subject = serviceTopic
    ? t(`holdingServices.${serviceTopic}.title`)
    : '';
  const context = [leadCode, subject].filter(Boolean).join(' · ');
  const message = [
    leadCode
      ? t('contact.whatsappTextLead', { code: leadCode })
      : t('contact.whatsappTextGeneral'),
    subject,
  ]
    .filter(Boolean)
    .join('\n');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyWeChat = async () => {
    if (!config.wechatId) return;
    track('wechat_copy', { lead: leadCode ?? '' });
    try {
      await navigator.clipboard?.writeText(config.wechatId);
      if (navigator.clipboard) setCopied(true);
    } catch {
      // Clipboard blocked (e.g. WeChat in-app browser): ID stays selectable.
    }
  };

  const copyLeadCode = async () => {
    if (!context) return;
    try {
      await navigator.clipboard?.writeText(context);
      if (navigator.clipboard) setCodeCopied(true);
    } catch {
      // The code remains visible and selectable when clipboard access fails.
    }
  };

  const wechat =
    config.wechatId || config.wechatQrSrc ? (
      <section key="wechat" data-channel="wechat" className={card}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
          <MessageCircle aria-hidden className="w-4 h-4 text-brand-muted" />
          {t('contact.wechatTitle')}
        </h3>
        <p className="mt-1 text-xs text-brand-muted">
          {t(
            serviceTopic && !leadCode
              ? 'contact.wechatServiceHint'
              : 'contact.wechatHint'
          )}
        </p>
        {config.wechatQrSrc && (
          <Image
            src={config.wechatQrSrc}
            alt={t('contact.wechatQrAlt')}
            width={176}
            height={176}
            className="mt-3 border border-brand-line bg-white"
          />
        )}
        {config.wechatId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="select-all font-mono text-sm text-brand-ink">
              {config.wechatId}
            </span>
            <button
              type="button"
              onClick={copyWeChat}
              className="brand-focus inline-flex min-h-11 items-center gap-1 border border-brand-line px-3 text-xs text-brand-ink hover:bg-brand-bg transition-colors"
            >
              {copied ? (
                <Check aria-hidden className="w-3.5 h-3.5" />
              ) : (
                <Copy aria-hidden className="w-3.5 h-3.5" />
              )}
              {copied ? t('contact.copied') : t('contact.copy')}
            </button>
          </div>
        )}
        {context && (
          <div className="mt-4 border-t border-brand-line pt-4">
            <span className="select-all font-mono text-sm text-brand-ink">
              {context}
            </span>
            <button
              type="button"
              onClick={copyLeadCode}
              aria-label={`${codeCopied ? t('contact.copied') : t('contact.copy')} ${context}`}
              className="brand-focus ml-3 inline-flex min-h-11 items-center gap-1 border border-brand-line px-3 text-xs text-brand-ink hover:bg-brand-bg transition-colors"
            >
              {codeCopied ? (
                <Check aria-hidden className="size-4" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {codeCopied ? t('contact.copied') : t('contact.copy')}
            </button>
          </div>
        )}
      </section>
    ) : null;

  const whatsapp = config.whatsappNumber ? (
    <section key="whatsapp" data-channel="whatsapp" className={card}>
      <h3 className="text-sm font-semibold text-brand-ink">
        {t('contact.whatsappTitle')}
      </h3>
      <a
        href={whatsappLink(config.whatsappNumber, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('click_whatsapp', { lead: leadCode ?? '' })}
        className="brand-button brand-focus mt-3 w-full"
      >
        <MessageCircle aria-hidden className="w-4 h-4" />
        {t('contact.whatsappCta')}
      </a>
    </section>
  ) : null;

  const email = config.email ? (
    <section key="email" data-channel="email" className={card}>
      <h3 className="text-sm font-semibold text-brand-ink">
        {t('contact.emailTitle')}
      </h3>
      <a
        href={`mailto:${config.email}${context ? `?body=${encodeURIComponent(message)}` : ''}`}
        className="brand-focus mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-brand-ink underline underline-offset-4 decoration-brand-line hover:text-brand-muted"
      >
        <Mail aria-hidden className="w-4 h-4" />
        {config.email}
      </a>
    </section>
  ) : null;

  const ordered =
    locale === 'zh' ? [wechat, whatsapp, email] : [whatsapp, wechat, email];
  const visible = ordered.filter(Boolean);
  if (!visible.length) return null;

  return <div className="space-y-3">{visible}</div>;
}
