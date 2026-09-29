import { isPublicPath } from '@/lib/analytics/attribution';
import {
  GA4_MEASUREMENT_ID,
  YANDEX_METRIKA_ID,
  isAnalyticsHost,
} from '@/lib/analytics/config';
import { readConsent } from '@/lib/analytics/consent';
import { SERVICE_TOPICS } from '@/lib/services/topics';
import { getGuideSlug } from '@/lib/insights/contact-context';

type MeasurementWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  ym?: (...args: unknown[]) => void;
};

const EVENTS = new Set([
  'inquiry_submit',
  'wechat_copy',
  'contact_context_copy',
  'click_email',
  'click_whatsapp',
]);
let active = false;
let gaLoaded = false;
let gaConfigured = false;
let ymLoaded = false;
let ymInitialized = false;
let lastPagePath: string | null = null;
let gaScript: HTMLScriptElement | null = null;
let gaScriptLoaded = false;
let ymScript: HTMLScriptElement | null = null;
let ymScriptLoaded = false;
let currentPageReferrer = '';

const DENIED = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
} as const;

function measurementWindow(): MeasurementWindow {
  return window as MeasurementWindow;
}

function sanitizedReferrer(): string {
  try {
    const url = new URL(document.referrer);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) ||
      url.hostname === 'qaznedr.kz' ||
      url.hostname === 'www.qaznedr.kz'
    )
      return '';
    return `https://${url.hostname.toLowerCase()}/`;
  } catch {
    return '';
  }
}

function safeLocation(path: string): string {
  return `https://qaznedr.kz${path}`;
}

function safeYandexReferrer(referrer: string): string {
  // The tag falls back to document.referrer when its referrer option is falsy.
  return referrer || 'https://qaznedr.kz/';
}

function gtag(..._args: unknown[]) {
  const browser = measurementWindow();
  browser.dataLayer = browser.dataLayer || [];
  // The gtag SDK expects its canonical Arguments queue shape.
  // eslint-disable-next-line prefer-rest-params
  browser.dataLayer.push(arguments);
}

function loadGA(path: string, referrer: string) {
  if (!GA4_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA4_MEASUREMENT_ID)) return;
  const browser = measurementWindow();
  if (!browser.gtag) browser.gtag = gtag;
  (browser as unknown as Record<string, unknown>)[
    `ga-disable-${GA4_MEASUREMENT_ID}`
  ] = false;
  if (!gaLoaded) {
    browser.gtag('consent', 'default', DENIED);
    const script = document.createElement('script');
    script.async = true;
    script.dataset.consentProvider = 'ga4';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    script.addEventListener('load', () => {
      if (gaScript !== script) return;
      if (active) gaScriptLoaded = true;
      else
        (measurementWindow() as unknown as Record<string, unknown>)[
          `ga-disable-${GA4_MEASUREMENT_ID}`
        ] = true;
    });
    script.addEventListener('error', () => {
      if (gaScript !== script) return;
      gaLoaded = false;
      gaConfigured = false;
      gaScript = null;
    });
    gaScript = script;
    gaLoaded = true;
    document.head.appendChild(script);
  }
  browser.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  if (!gaConfigured) {
    browser.gtag('js', new Date());
    browser.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: safeLocation(path),
      page_referrer: referrer,
    });
    gaConfigured = true;
  }
}

function loadYandex(path: string, referrer: string) {
  const id = YANDEX_METRIKA_ID;
  if (!id || !Number.isSafeInteger(id) || id <= 0) return;
  const browser = measurementWindow();
  if (!browser.ym) {
    const queue: IArguments[] = [];
    const stub = function (..._args: unknown[]) {
      // The Yandex SDK expects the canonical Arguments queue shape.
      // eslint-disable-next-line prefer-rest-params
      queue.push(arguments);
    };
    Object.assign(stub, { a: queue, l: Date.now() });
    browser.ym = stub;
  }
  if (!ymLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.consentProvider = 'metrika';
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    script.addEventListener('load', () => {
      if (ymScript === script && active) ymScriptLoaded = true;
    });
    script.addEventListener('error', () => {
      if (ymScript !== script) return;
      ymLoaded = false;
      ymInitialized = false;
      ymScript = null;
    });
    ymScript = script;
    ymLoaded = true;
    document.head.appendChild(script);
  }
  if (!ymInitialized) {
    browser.ym(id, 'init', {
      defer: true,
      clickmap: false,
      ecommerce: false,
      trackLinks: false,
      trackHash: false,
      accurateTrackBounce: false,
      webvisor: false,
      sendTitle: false,
      url: safeLocation(path),
      referrer: safeYandexReferrer(referrer),
    });
    ymInitialized = true;
  }
}

function disableProviders() {
  const browser = measurementWindow();
  // Hard-disable first: consent-denied alone can still produce cookieless GA pings.
  if (gaLoaded)
    (browser as unknown as Record<string, unknown>)[
      `ga-disable-${GA4_MEASUREMENT_ID}`
    ] = true;
  // Remove commands waiting for a delayed SDK load, including already granted consent.
  browser.dataLayer?.splice(0);
  if (gaScript && !gaScriptLoaded) {
    gaScript.remove();
    gaScript = null;
    gaLoaded = false;
    gaConfigured = false;
  }
  if (ymScript && !ymScriptLoaded) {
    ymScript.remove();
    ymScript = null;
    ymLoaded = false;
  }
  const ymQueue = (browser.ym as unknown as { a?: unknown[][] } | undefined)?.a;
  ymQueue?.splice(0);
  const wasActive = active;
  active = false;
  lastPagePath = null;
  currentPageReferrer = '';
  if (gaLoaded && wasActive) browser.gtag?.('consent', 'update', DENIED);
  if (ymInitialized && YANDEX_METRIKA_ID && wasActive) {
    if (ymScriptLoaded) browser.ym?.(YANDEX_METRIKA_ID, 'destruct');
    ymInitialized = false;
  }
}

export function syncProviders(
  path: string,
  consent: boolean,
  host = typeof window === 'undefined' ? '' : window.location.hostname
): void {
  if (typeof window === 'undefined') return;
  if (
    !consent ||
    readConsent()?.analytics !== true ||
    !isAnalyticsHost(host) ||
    !isPublicPath(path)
  ) {
    disableProviders();
    return;
  }
  try {
    const wasActive = active;
    const referrer = lastPagePath
      ? lastPagePath === path
        ? currentPageReferrer
        : safeLocation(lastPagePath)
      : sanitizedReferrer();
    active = true;
    loadGA(path, referrer);
    loadYandex(path, referrer);
    if (lastPagePath !== path || !wasActive) {
      const location = safeLocation(path);
      if (gaLoaded)
        measurementWindow().gtag?.('event', 'page_view', {
          page_location: location,
          page_referrer: referrer,
        });
      if (ymInitialized && YANDEX_METRIKA_ID)
        measurementWindow().ym?.(YANDEX_METRIKA_ID, 'hit', location, {
          referer: safeYandexReferrer(referrer),
        });
      lastPagePath = path;
      currentPageReferrer = referrer;
    }
  } catch {
    disableProviders();
  }
}

export function trackConsentEvent(
  event: string,
  properties: Record<string, unknown>
): void {
  if (!active || !EVENTS.has(event)) return;
  if (
    !isAnalyticsHost(window.location.hostname) ||
    !isPublicPath(window.location.pathname)
  ) {
    disableProviders();
    return;
  }
  if (readConsent()?.analytics !== true) {
    disableProviders();
    return;
  }
  try {
    // A contact action can beat the pathname effect after SPA navigation.
    if (lastPagePath !== window.location.pathname) {
      syncProviders(window.location.pathname, true, window.location.hostname);
      if (!active) return;
    }
    const params: Record<string, string> = {};
    if (['ru', 'kz', 'en', 'zh'].includes(String(properties.locale)))
      params.locale = String(properties.locale);
    if (
      typeof properties.lead === 'string' &&
      /^[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,16}){1,3}$/.test(properties.lead)
    )
      params.lead = properties.lead;
    if (
      typeof properties.topic === 'string' &&
      (SERVICE_TOPICS as readonly string[]).includes(properties.topic)
    )
      params.topic = properties.topic;
    if (
      typeof properties.channel === 'string' &&
      ['wechat', 'whatsapp', 'email', 'phone', 'telegram'].includes(
        properties.channel
      )
    )
      params.channel = properties.channel;
    if (properties.place === 'hero') params.place = 'hero';
    const guide = getGuideSlug(properties.guide);
    if (guide) params.guide = guide;
    params.page_location = safeLocation(window.location.pathname);
    params.page_referrer = currentPageReferrer;
    if (gaLoaded) measurementWindow().gtag?.('event', event, params);
    if (ymInitialized && YANDEX_METRIKA_ID)
      measurementWindow().ym?.(YANDEX_METRIKA_ID, 'reachGoal', event, params);
  } catch {
    // Third-party measurement must never block a contact action.
  }
}

export function revokeProviders(): void {
  disableProviders();
  if (typeof document === 'undefined') return;
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0];
    if (!/^(_ga(?:_|$)|_ym_|ym_|yandexuid$)/.test(name)) continue;
    const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = expired;
    document.cookie = `${expired}; Domain=qaznedr.kz`;
    document.cookie = `${expired}; Domain=.qaznedr.kz`;
  }
}
