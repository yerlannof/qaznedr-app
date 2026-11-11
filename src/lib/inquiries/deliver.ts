import * as Sentry from '@sentry/nextjs';
import { notifyTelegram } from './notify';

type Context = Record<string, string>;

export interface DeliveryOptions {
  send?: (text: string) => Promise<boolean>;
  /** Pause before the single retry. */
  delayMs?: number;
  report?: (error: Error, context: Context) => void;
  /** Identifiers only (e.g. the inquiry id); never the message text. */
  context?: Context;
}

// Two attempts of 3.5 s plus the pause stay inside the 10 s function limit.
const ATTEMPT_TIMEOUT_MS = 3500;
const RETRY_DELAY_MS = 750;

function reportToSentry(error: Error, context: Context): void {
  Sentry.captureException(error, {
    level: 'error',
    tags: { feature: 'inquiry-notification', channel: 'telegram' },
    fingerprint: ['inquiry-notification-telegram'],
    extra: context,
  });
}

async function attempt(
  send: (text: string) => Promise<boolean>,
  text: string
): Promise<boolean> {
  try {
    return await send(text);
  } catch {
    return false;
  }
}

/**
 * Send, wait briefly, send once more; if Telegram still did not accept the
 * message, leave a trace in the error tracker. Never throws.
 */
export async function notifyTelegramWithRetry(
  text: string,
  {
    send = (body) =>
      notifyTelegram(body, undefined, undefined, ATTEMPT_TIMEOUT_MS),
    delayMs = RETRY_DELAY_MS,
    report = reportToSentry,
    context = {},
  }: DeliveryOptions = {}
): Promise<boolean> {
  if (await attempt(send, text)) return true;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (await attempt(send, text)) return true;
  try {
    report(new Error('Telegram notification failed after one retry'), context);
  } catch {
    // Reporting must never break the caller.
  }
  return false;
}
