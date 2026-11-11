import type { InquiryInput } from './schema';

export const ADMIN_INQUIRIES_URL = 'https://qaznedr.kz/ru/admin/inquiries';

const PHONE_LIKE = /^\+?[\d\s().-]+$/;

/**
 * International digits for a reply link, or null when the contact is not a
 * phone number. Kazakhstan habits: 8XXXXXXXXXX → 7XXXXXXXXXX, and a bare
 * 7XXXXXXXXX (10 digits, no country code) gets the leading 7.
 */
export function replyPhoneDigits(contact: string): string | null {
  const value = contact.trim();
  if (!PHONE_LIKE.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8'))
    return `7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('7')) return `7${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

function replyLine(input: InquiryInput): string | null {
  if (input.channel !== 'whatsapp' && input.channel !== 'phone') return null;
  const digits = replyPhoneDigits(input.contact);
  if (!digits) return null;
  return input.channel === 'whatsapp'
    ? `Ответить в WhatsApp: https://wa.me/${digits}`
    : `Позвонить: +${digits}`;
}

/**
 * The message is sent as plain text (no parse_mode), so Telegram shows user
 * input literally and needs no Markdown/HTML escaping. Line breaks in
 * single-line fields are flattened so they cannot imitate our own lines.
 */
export const singleLine = (value: string) =>
  value.replace(/[\r\n\u2028\u2029]+/g, ' ').trim();

export function formatInquiryMessage(input: InquiryInput, id: string): string {
  const lines = [
    'Новая заявка с qaznedr.kz',
    input.leadCode ? `Участок: ${input.leadCode}` : null,
    `Имя: ${singleLine(input.name)}`,
    input.company ? `Компания: ${singleLine(input.company)}` : null,
    input.country ? `Страна: ${singleLine(input.country)}` : null,
    `Связь: ${input.channel}: ${singleLine(input.contact)}`,
    replyLine(input),
    `Язык сайта: ${input.locale}`,
    input.message ? `Сообщение: ${input.message}` : null,
    input.sourcePath ? `Страница: ${singleLine(input.sourcePath)}` : null,
    `ID: ${id}`,
    `Все заявки: ${ADMIN_INQUIRIES_URL}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function notifyTelegram(
  text: string,
  env: { token?: string; chatId?: string } = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  fetchImpl: (
    url: string,
    init: RequestInit
  ) => Promise<{ ok: boolean }> = fetch,
  // The inquiry is already saved; don't keep the visitor waiting on Telegram.
  timeoutMs = 4000
): Promise<boolean> {
  if (!env.token || !env.chatId) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(
      `https://api.telegram.org/bot${env.token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      }
    );
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
