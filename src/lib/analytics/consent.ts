export const CONSENT_KEY = 'qaznedr_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentChoice = {
  version: typeof CONSENT_VERSION;
  decidedAt: number;
  analytics: boolean;
  advertising: false;
};

let memoryChoice: ConsentChoice | null = null;
let memoryOnly = false;

function validChoice(value: unknown, now: number): ConsentChoice | null {
  if (!value || typeof value !== 'object') return null;
  const choice = value as Partial<ConsentChoice>;
  if (
    choice.version !== CONSENT_VERSION ||
    typeof choice.analytics !== 'boolean' ||
    choice.advertising !== false ||
    typeof choice.decidedAt !== 'number' ||
    !Number.isFinite(choice.decidedAt) ||
    choice.decidedAt > now ||
    now - choice.decidedAt >= CONSENT_TTL_MS
  )
    return null;
  return choice as ConsentChoice;
}

export function readConsent(now = Date.now()): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  if (memoryOnly) return validChoice(memoryChoice, now);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return validChoice(memoryChoice, now);
  }
  if (!raw) return memoryOnly ? validChoice(memoryChoice, now) : null;
  try {
    return validChoice(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

export function writeConsent(
  analytics: boolean,
  now = Date.now()
): ConsentChoice {
  const choice: ConsentChoice = {
    version: CONSENT_VERSION,
    decidedAt: now,
    analytics,
    advertising: false,
  };
  memoryChoice = choice;
  memoryOnly = false;
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
  } catch {
    memoryOnly = true;
  }
  return choice;
}
