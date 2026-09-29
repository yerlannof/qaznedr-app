/** @jest-environment-options {"url":"https://qaznedr.kz/"} */
import {
  syncProviders,
  trackConsentEvent,
  revokeProviders,
} from '@/lib/analytics/providers';
import { CONSENT_KEY, writeConsent } from '@/lib/analytics/consent';
import { GUIDE } from '@/lib/insights/registry';

it('gates requests by consent, host and public path; sanitizes events and stops on revoke', () => {
  window.history.replaceState(
    {},
    '',
    '/zh/leads?email=private%40email.test#secret'
  );
  const originalReferrer = Object.getOwnPropertyDescriptor(
    document,
    'referrer'
  );
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: 'https://baidu.com/secret-path?email=private%40email.test',
  });
  syncProviders('/zh/leads', true, 'localhost');
  expect(document.querySelector('script[data-consent-provider]')).toBeNull();
  syncProviders('/zh/leads', false, 'qaznedr.kz');
  expect(document.querySelector('script[data-consent-provider]')).toBeNull();
  syncProviders('/zh/admin', true, 'qaznedr.kz');
  expect(document.querySelector('script[data-consent-provider]')).toBeNull();
  syncProviders('/zh/leads', true, 'qaznedr.kz');
  expect(document.querySelector('script[data-consent-provider]')).toBeNull();

  writeConsent(true);

  syncProviders('/zh/leads', true, 'qaznedr.kz');
  expect(
    document.querySelectorAll('script[data-consent-provider="ga4"]')
  ).toHaveLength(1);
  expect(
    document.querySelectorAll('script[data-consent-provider="metrika"]')
  ).toHaveLength(1);
  const ymQueue = (window as unknown as { ym: { a: IArguments[] } }).ym.a;
  const init = ymQueue.find((call) => call[1] === 'init');
  expect(Object.prototype.toString.call(init)).toBe('[object Arguments]');
  expect(init?.[0]).toBe(113126250);
  expect(init?.[2]).toMatchObject({
    defer: true,
    clickmap: false,
    ecommerce: false,
    trackLinks: false,
    webvisor: false,
    trackHash: false,
    sendTitle: false,
    url: 'https://qaznedr.kz/zh/leads',
    referrer: 'https://baidu.com/',
  });
  window.history.replaceState({}, '', '/zh/contact?name=secret#hash');
  syncProviders('/zh/contact', true, 'qaznedr.kz');
  expect(
    document.querySelectorAll('script[data-consent-provider="ga4"]')
  ).toHaveLength(1);
  const calls = (window as unknown as { dataLayer: unknown[][] }).dataLayer;
  const config = calls.find((call) => call[0] === 'config') as unknown[];
  expect(config[2]).toMatchObject({
    page_location: 'https://qaznedr.kz/zh/leads',
    page_referrer: 'https://baidu.com/',
  });
  expect(Object.prototype.toString.call(config)).toBe('[object Arguments]');
  expect(JSON.stringify(calls)).toContain('https://qaznedr.kz/zh/contact');
  expect(JSON.stringify(calls)).not.toContain('utm_');
  const hits = ymQueue.filter((call) => call[1] === 'hit');
  expect(hits).toHaveLength(2);
  expect(hits[0][2]).toBe('https://qaznedr.kz/zh/leads');
  expect(hits[0][3]).toMatchObject({ referer: 'https://baidu.com/' });
  expect(hits[1][2]).toBe('https://qaznedr.kz/zh/contact');
  expect(hits[1][3]).toMatchObject({
    referer: 'https://qaznedr.kz/zh/leads',
  });
  const pageViews = calls.filter(
    (call) => call[0] === 'event' && call[1] === 'page_view'
  );
  expect(pageViews[1][2]).toMatchObject({
    page_referrer: 'https://qaznedr.kz/zh/leads',
  });
  trackConsentEvent('click_whatsapp', {
    locale: 'zh',
    lead: 'AU-4',
    contact: 'private@email.test',
  } as never);
  const custom = calls
    .filter((call) => call[0] === 'event' && call[1] === 'click_whatsapp')
    .at(-1) as unknown[];
  trackConsentEvent('click_whatsapp', {
    locale: 'zh',
    guide: GUIDE.geologicalMap,
  });
  expect(
    calls
      .filter((call) => call[0] === 'event' && call[1] === 'click_whatsapp')
      .at(-1)?.[2]
  ).toMatchObject({ guide: GUIDE.geologicalMap });
  trackConsentEvent('click_whatsapp', {
    locale: 'zh',
    guide: 'private-notes',
  });
  expect(
    calls
      .filter((call) => call[0] === 'event' && call[1] === 'click_whatsapp')
      .at(-1)?.[2]
  ).not.toHaveProperty('guide');
  expect(custom[2]).toMatchObject({
    page_location: 'https://qaznedr.kz/zh/contact',
    page_referrer: 'https://qaznedr.kz/zh/leads',
  });
  expect(JSON.stringify(calls)).toContain('AU-4');
  expect(JSON.stringify(calls)).not.toContain('private@email.test');
  const goal = ymQueue.find(
    (call) => call[1] === 'reachGoal' && call[2] === 'click_whatsapp'
  );
  expect(goal?.[0]).toBe(113126250);
  expect(goal?.[3]).toMatchObject({
    locale: 'zh',
    lead: 'AU-4',
    page_location: 'https://qaznedr.kz/zh/contact',
    page_referrer: 'https://qaznedr.kz/zh/leads',
  });
  expect(JSON.stringify(ymQueue)).not.toContain('private@email.test');
  expect(JSON.stringify(ymQueue)).not.toContain('secret-path');
  expect(JSON.stringify(ymQueue)).not.toContain('name=secret');

  revokeProviders();
  expect(
    (window as unknown as Record<string, unknown>)['ga-disable-G-HPGRR5049G']
  ).toBe(true);
  expect(
    document.querySelector('script[data-consent-provider="ga4"]')
  ).toBeNull();
  expect(calls.some((call) => call[0] === 'event')).toBe(false);
  expect(ymQueue).toHaveLength(0);
  trackConsentEvent('click_whatsapp', { locale: 'zh', lead: 'AU-4' });
  expect(calls.some((call) => call[0] === 'event')).toBe(false);

  writeConsent(true);
  syncProviders('/zh/leads', true, 'qaznedr.kz');
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: 1,
      decidedAt: 1,
      analytics: true,
      advertising: false,
    })
  );
  trackConsentEvent('click_whatsapp', { locale: 'zh', lead: 'AU-4' });
  expect(calls.filter((call) => call[0] === 'event')).toHaveLength(0);
  if (originalReferrer)
    Object.defineProperty(document, 'referrer', originalReferrer);
});

it('does not reactivate from stale stored opt-in or send on a private SPA path', () => {
  revokeProviders();
  writeConsent(true);
  syncProviders('/zh/contact', true, 'qaznedr.kz');
  const calls = (window as unknown as { dataLayer: unknown[][] }).dataLayer;
  window.history.replaceState({}, '', '/zh/admin');
  trackConsentEvent('click_email', { locale: 'zh' });
  expect(calls.filter((call) => call[0] === 'event')).toHaveLength(0);
  const set = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('quota');
    });
  writeConsent(false);
  syncProviders('/zh/contact', true, 'qaznedr.kz');
  expect(
    (window as unknown as Record<string, unknown>)['ga-disable-G-HPGRR5049G']
  ).toBe(true);
  set.mockRestore();
});

it('drops a pending Yandex queue and script before its SDK can load', () => {
  jest.isolateModules(() => {
    jest.doMock('@/lib/analytics/config', () => ({
      GA4_MEASUREMENT_ID: 'G-HPGRR5049G',
      YANDEX_METRIKA_ID: 12345678,
      isAnalyticsHost: (host: string) => host === 'qaznedr.kz',
    }));
    const isolated =
      require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
    window.history.replaceState({}, '', '/zh/contact');
    writeConsent(true);
    isolated.syncProviders('/zh/contact', true, 'qaznedr.kz');
    const pending = document.querySelector<HTMLScriptElement>(
      'script[data-consent-provider="metrika"]'
    );
    const queue = (window as unknown as { ym: { a: unknown[] } }).ym.a;
    expect(pending).not.toBeNull();
    expect(queue.length).toBeGreaterThan(0);
    isolated.revokeProviders();
    expect(queue).toHaveLength(0);
    expect(pending?.isConnected).toBe(false);
    pending?.dispatchEvent(new Event('load'));
    expect(queue).toHaveLength(0);
    jest.dontMock('@/lib/analytics/config');
  });
});

it('ignores a late load from a revoked GA script after a fresh opt-in', () => {
  jest.isolateModules(() => {
    const isolated =
      require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
    window.history.replaceState({}, '', '/zh/contact');
    writeConsent(true);
    isolated.syncProviders('/zh/contact', true, 'qaznedr.kz');
    const oldScript = document.querySelector<HTMLScriptElement>(
      'script[data-consent-provider="ga4"]'
    );
    isolated.revokeProviders();
    writeConsent(true);
    isolated.syncProviders('/zh/contact', true, 'qaznedr.kz');
    const newScript = document.querySelector<HTMLScriptElement>(
      'script[data-consent-provider="ga4"]'
    );
    expect(newScript).not.toBe(oldScript);
    oldScript?.dispatchEvent(new Event('load'));
    expect(
      (window as unknown as Record<string, unknown>)['ga-disable-G-HPGRR5049G']
    ).toBe(false);
    newScript?.dispatchEvent(new Event('load'));
    expect(
      (window as unknown as Record<string, unknown>)['ga-disable-G-HPGRR5049G']
    ).toBe(false);
    isolated.revokeProviders();
  });
});

it('uses a safe internal referrer when the document referrer is private', () => {
  const originalReferrer = Object.getOwnPropertyDescriptor(
    document,
    'referrer'
  );
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: 'https://qaznedr.kz/admin?token=secret',
  });
  jest.isolateModules(() => {
    delete (window as unknown as { ym?: unknown }).ym;
    const isolated =
      require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
    window.history.replaceState({}, '', '/ru/contact?name=secret');
    writeConsent(true);
    isolated.syncProviders('/ru/contact', true, 'qaznedr.kz');
    const queue = (window as unknown as { ym: { a: IArguments[] } }).ym.a;
    const init = queue.find((call) => call[1] === 'init');
    const hit = queue.find((call) => call[1] === 'hit');
    expect(init?.[2].referrer).toBe('https://qaznedr.kz/');
    expect(hit?.[3].referer).toBe('https://qaznedr.kz/');
    expect(JSON.stringify(queue)).not.toContain('token=secret');
    isolated.revokeProviders();
  });
  if (originalReferrer)
    Object.defineProperty(document, 'referrer', originalReferrer);
});

it('removes the new pending Yandex script despite a late load from the revoked one', () => {
  jest.isolateModules(() => {
    delete (window as unknown as { ym?: unknown }).ym;
    const isolated =
      require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
    window.history.replaceState({}, '', '/zh/contact');
    writeConsent(true);
    isolated.syncProviders('/zh/contact', true, 'qaznedr.kz');
    const oldScript = document.querySelector<HTMLScriptElement>(
      'script[data-consent-provider="metrika"]'
    );
    const queue = (window as unknown as { ym: { a: IArguments[] } }).ym.a;
    isolated.revokeProviders();
    expect(queue).toHaveLength(0);
    writeConsent(true);
    isolated.syncProviders('/zh/contact', true, 'qaznedr.kz');
    const newScript = document.querySelector<HTMLScriptElement>(
      'script[data-consent-provider="metrika"]'
    );
    expect(newScript).not.toBe(oldScript);
    expect(queue.some((call) => call[1] === 'hit')).toBe(true);
    oldScript?.dispatchEvent(new Event('load'));
    isolated.revokeProviders();
    expect(queue).toHaveLength(0);
    expect(newScript?.isConnected).toBe(false);
    newScript?.dispatchEvent(new Event('load'));
    expect(queue).toHaveLength(0);
  });
});

it('records a sanitized SPA hit before a goal even when navigation effect has not run', () => {
  jest.isolateModules(() => {
    delete (window as unknown as { ym?: unknown }).ym;
    const isolated =
      require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
    window.history.replaceState({}, '', '/ru/leads');
    writeConsent(true);
    isolated.syncProviders('/ru/leads', true, 'qaznedr.kz');
    const queue = (window as unknown as { ym: { a: IArguments[] } }).ym.a;
    window.history.replaceState({}, '', '/ru/contact?email=secret#private');
    isolated.trackConsentEvent('click_email', { locale: 'ru' });
    const goalIndex = queue.findIndex(
      (call) => call[1] === 'reachGoal' && call[2] === 'click_email'
    );
    expect(goalIndex).toBeGreaterThan(0);
    expect(queue[goalIndex - 1][1]).toBe('hit');
    expect(queue[goalIndex - 1][2]).toBe('https://qaznedr.kz/ru/contact');
    expect(queue[goalIndex - 1][3].referer).toBe('https://qaznedr.kz/ru/leads');
    expect(queue[goalIndex][3].page_referrer).toBe(
      'https://qaznedr.kz/ru/leads'
    );
    const calls = (window as unknown as { dataLayer: unknown[][] }).dataLayer;
    const pageViews = calls.filter(
      (call) => call[0] === 'event' && call[1] === 'page_view'
    );
    const goal = calls.find(
      (call) => call[0] === 'event' && call[1] === 'click_email'
    );
    expect(pageViews.at(-1)?.[2]).toMatchObject({
      page_referrer: 'https://qaznedr.kz/ru/leads',
    });
    expect(goal?.[2]).toMatchObject({
      page_referrer: 'https://qaznedr.kz/ru/leads',
    });
    expect(JSON.stringify(queue)).not.toContain('email=secret');
    isolated.revokeProviders();
  });
});

it('resets SPA referrer after revoke and never uses a private page', () => {
  const originalReferrer = Object.getOwnPropertyDescriptor(
    document,
    'referrer'
  );
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: 'https://qaznedr.kz/admin?token=secret',
  });
  try {
    jest.isolateModules(() => {
      delete (window as unknown as { ym?: unknown }).ym;
      const isolated =
        require('@/lib/analytics/providers') as typeof import('@/lib/analytics/providers');
      writeConsent(true);
      window.history.replaceState({}, '', '/ru/leads');
      isolated.syncProviders('/ru/leads', true, 'qaznedr.kz');
      window.history.replaceState({}, '', '/ru/contact');
      isolated.syncProviders('/ru/contact', true, 'qaznedr.kz');
      isolated.revokeProviders();

      writeConsent(true);
      window.history.replaceState({}, '', '/ru/admin?token=secret');
      isolated.syncProviders('/ru/admin', true, 'qaznedr.kz');
      window.history.replaceState({}, '', '/ru/faq');
      isolated.syncProviders('/ru/faq', true, 'qaznedr.kz');
      const queue = (window as unknown as { ym: { a: IArguments[] } }).ym.a;
      const hit = queue.find((call) => call[1] === 'hit');
      expect(hit?.[2]).toBe('https://qaznedr.kz/ru/faq');
      expect(hit?.[3].referer).toBe('https://qaznedr.kz/');
      expect(JSON.stringify(queue)).not.toContain('admin');
      expect(JSON.stringify(queue)).not.toContain('token=secret');
      isolated.revokeProviders();
    });
  } finally {
    if (originalReferrer)
      Object.defineProperty(document, 'referrer', originalReferrer);
  }
});
