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
