import { track } from '@vercel/analytics';
import { trackConsentEvent } from '@/lib/analytics/providers';

export type ContactEvent =
  | 'inquiry_submit'
  | 'wechat_copy'
  | 'contact_context_copy'
  | 'click_email'
  | 'click_whatsapp';

export function safeTrack(
  event: ContactEvent,
  properties: {
    locale: string;
    lead?: string;
    topic?: string;
    channel?: string;
    place?: string;
  }
): void {
  try {
    const context = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined)
    );
    track(event, context);
  } catch {
    // Analytics must not interrupt a contact action.
  }
  try {
    trackConsentEvent(event, properties);
  } catch {
    // Consent-gated providers are independent of Vercel Analytics.
  }
}
