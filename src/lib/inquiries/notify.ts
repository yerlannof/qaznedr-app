import type { InquiryInput } from './schema';

export function formatInquiryMessage(input: InquiryInput, id: string): string {
  const lines = [
    'Новая заявка с qaznedr.kz',
    input.leadCode ? `Участок: ${input.leadCode}` : null,
    `Имя: ${input.name}`,
    input.company ? `Компания: ${input.company}` : null,
    input.country ? `Страна: ${input.country}` : null,
    `Связь: ${input.channel}: ${input.contact}`,
    `Язык сайта: ${input.locale}`,
    input.message ? `Сообщение: ${input.message}` : null,
    input.sourcePath ? `Страница: ${input.sourcePath}` : null,
    `ID: ${id}`,
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
