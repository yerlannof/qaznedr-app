'use client';

import Image from 'next/image';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import { whatsappLink, type ContactConfig } from '@/lib/config/contacts';

interface ContactChannelsProps {
  config: ContactConfig;
  locale: string;
  leadCode?: string;
}

const card =
  'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-5';

export default function ContactChannels({
  config,
  locale,
  leadCode,
}: ContactChannelsProps) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const [copied, setCopied] = useState(false);

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

  const wechat =
    config.wechatId || config.wechatQrSrc ? (
      <section key="wechat" data-channel="wechat" className={card}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <MessageCircle
            aria-hidden
            className="w-4 h-4 text-gold-dark dark:text-gold-light"
          />
          {t('contact.wechatTitle')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{t('contact.wechatHint')}</p>
        {config.wechatQrSrc && (
          <Image
            src={config.wechatQrSrc}
            alt={t('contact.wechatQrAlt')}
            width={176}
            height={176}
            className="mt-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white"
          />
        )}
        {config.wechatId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="select-all font-mono text-sm text-gray-900 dark:text-gray-100">
              {config.wechatId}
            </span>
            <button
              type="button"
              onClick={copyWeChat}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
      </section>
    ) : null;

  const whatsapp = config.whatsappNumber ? (
    <section key="whatsapp" data-channel="whatsapp" className={card}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('contact.whatsappTitle')}
      </h3>
      <a
        href={whatsappLink(
          config.whatsappNumber,
          leadCode
            ? t('contact.whatsappTextLead', { code: leadCode })
            : t('contact.whatsappTextGeneral')
        )}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('click_whatsapp', { lead: leadCode ?? '' })}
        className="mt-3 flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
      >
        <MessageCircle aria-hidden className="w-4 h-4" />
        {t('contact.whatsappCta')}
      </a>
    </section>
  ) : null;

  const email = config.email ? (
    <section key="email" data-channel="email" className={card}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('contact.emailTitle')}
      </h3>
      <a
        href={`mailto:${config.email}`}
        className="mt-2 inline-flex items-center gap-2 text-sm text-[#0060DF] hover:underline"
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
