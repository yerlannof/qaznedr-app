import { track } from '@vercel/analytics';
import { trackConsentEvent } from '@/lib/analytics/providers';
import { getGuideSlug } from '@/lib/insights/contact-context';

export type ContactEvent =
  | 'inquiry_submit'
  | 'wechat_copy'
  | 'contact_context_copy'
  | 'click_email'
  | 'click_whatsapp';

// Vercel Analytics keeps property values up to 255 characters.
const MAX_PATH = 255;

/** Pathname only: no query string or hash, so no UTM/contact data leaks. */
function currentPath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname.slice(0, MAX_PATH);
}

export function safeTrack(
  event: ContactEvent,
  properties: {
    locale: string;
    lead?: string;
    topic?: string;
    channel?: string;
    place?: string;
    guide?: string;
  }
): void {
  try {
    const context = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined)
    );
    const guide = getGuideSlug(properties.guide);
    if (guide) context.guide = guide;
    else delete context.guide;
    // Contact clicks carry the page so clicks can be compared per page.
    const path = event.startsWith('click_') ? currentPath() : undefined;
    if (path) context.path = path;
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
