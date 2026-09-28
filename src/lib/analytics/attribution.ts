const KEY = 'qaznedr_attribution';
const TTL_MS = 30 * 60 * 1000;
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  landing_path: string;
  referrer_host?: string;
};

export function isPublicPath(path: string): boolean {
  const parts = path.split('/').filter(Boolean);
  if (!['ru', 'kz', 'en', 'zh'].includes(parts[0])) return false;
  if (parts.length === 1) return true;
  if (['about', 'contact', 'faq'].includes(parts[1])) return parts.length === 2;
  if (parts[1] === 'leads')
    return (
      parts.length === 2 ||
      (parts.length === 3 &&
        /^[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,16}){1,3}$/.test(parts[2]))
    );
  if (parts[1] === 'services')
    return (
      parts.length === 2 ||
      (parts.length === 3 &&
        ['investors', 'equipment', 'legal', 'geological', 'catalog'].includes(
          parts[2]
        ))
    );
  if (parts[1] === 'insights' || parts[1] === 'minerals')
    return (
      parts.length === 2 ||
      (parts.length === 3 && /^[a-z0-9-]{1,100}$/.test(parts[2]))
    );
  return parts[1] === 'legal' && parts[2] === 'terms' && parts.length === 3;
}

function validPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.length <= 300 &&
    /^\/(?:ru|kz|en|zh)(?:\/[A-Za-z0-9/-]*)?$/.test(path) &&
    !path.includes('..') &&
    isPublicPath(path)
  );
}

function validHost(host: unknown): host is string {
  return (
    typeof host === 'string' &&
    host.length <= 253 &&
    /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(host)
  );
}

function parseStored(raw: string | null, now: number): Attribution | undefined {
  if (!raw) return;
  try {
    const record = JSON.parse(raw) as { capturedAt?: unknown; utm?: unknown };
    if (
      typeof record.capturedAt !== 'number' ||
      !Number.isFinite(record.capturedAt) ||
      record.capturedAt > now ||
      now - record.capturedAt >= TTL_MS
    )
      return;
    if (!record.utm || typeof record.utm !== 'object') return;
    const input = record.utm as Record<string, unknown>;
    if (!validPath(input.landing_path)) return;
    const utm: Attribution = { landing_path: input.landing_path };
    for (const key of UTM_KEYS) {
      const value = input[key];
      if (value !== undefined) {
        if (typeof value !== 'string' || value.length > 200) return;
        utm[key] = value;
      }
    }
    if (input.referrer_host !== undefined) {
      if (!validHost(input.referrer_host)) return;
      utm.referrer_host = input.referrer_host;
    }
    return utm;
  } catch {
    return;
  }
}

function current(
  path: string,
  search: string,
  referrer: string
): Attribution | undefined {
  if (!validPath(path)) return;
  const utm: Attribution = { landing_path: path };
  const params = new URLSearchParams(search);
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`);
    if (value && value.length <= 200) utm[key] = value;
  }
  try {
    const url = new URL(referrer);
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      validHost(url.hostname) &&
      !['qaznedr.kz', 'www.qaznedr.kz'].includes(url.hostname.toLowerCase()) &&
      url.hostname !== window.location.hostname
    ) {
      utm.referrer_host = url.hostname.toLowerCase();
    }
  } catch {
    // Direct visit or invalid referrer.
  }
  return utm;
}

export function captureAttribution(
  path: string,
  search: string,
  referrer: string,
  now = Date.now()
): Attribution | undefined {
  if (!validPath(path)) return;
  try {
    const existing = parseStored(window.sessionStorage.getItem(KEY), now);
    if (existing) return existing;
  } catch {
    // Storage can be disabled by the browser.
  }
  const utm = current(path, search, referrer);
  if (!utm) return;
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ capturedAt: now, utm })
    );
  } catch {
    // Form submission still uses the current URL.
  }
  return utm;
}

export function readAttribution(
  path: string,
  search: string,
  now = Date.now()
): Attribution | undefined {
  if (!validPath(path)) return;
  try {
    const stored = parseStored(window.sessionStorage.getItem(KEY), now);
    if (stored) return stored;
  } catch {
    // Storage can be disabled by the browser.
  }
  return current(path, search, '');
}
