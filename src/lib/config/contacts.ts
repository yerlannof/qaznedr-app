import { translate } from '@/lib/i18n/translations';

export interface ContactConfig {
  whatsappNumber: string | null;
  wechatId: string | null;
  wechatQrSrc: string | null;
  email: string | null;
}

const clean = (value?: string): string | null =>
  value && value.trim() ? value.trim() : null;

export function normalizeContactConfig(raw: {
  whatsapp?: string;
  wechatId?: string;
  wechatQr?: string;
  email?: string;
}): ContactConfig {
  const digits = (raw.whatsapp ?? '').replace(/\D/g, '');
  return {
    whatsappNumber: digits || null,
    wechatId: clean(raw.wechatId),
    wechatQrSrc: clean(raw.wechatQr),
    email: clean(raw.email),
  };
}

// Literal process.env.NEXT_PUBLIC_* reads so Next.js inlines them at build time.
export function getContactConfig(): ContactConfig {
  return normalizeContactConfig({
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    wechatId: process.env.NEXT_PUBLIC_WECHAT_ID,
    wechatQr: process.env.NEXT_PUBLIC_WECHAT_QR,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  });
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function hasAnyChannel(c: ContactConfig): boolean {
  return Boolean(c.whatsappNumber || c.wechatId || c.wechatQrSrc || c.email);
}

/** The hero's main button: WeChat QR for zh, WhatsApp elsewhere, else the contact page. */
export function primaryContactCta(
  locale: string,
  c: ContactConfig
): { kind: 'whatsapp' | 'wechat' | 'contact'; href: string } {
  const contact = `/${locale}/contact`;
  if (locale === 'zh' && (c.wechatQrSrc || c.wechatId)) {
    return { kind: 'wechat', href: contact };
  }
  if (c.whatsappNumber) {
    return {
      kind: 'whatsapp',
      href: whatsappLink(
        c.whatsappNumber,
        translate(locale, 'contact.whatsappTextGeneral')
      ),
    };
  }
  return { kind: 'contact', href: contact };
}
