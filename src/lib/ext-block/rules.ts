/**
 * Qaznedr block extension (T-0220): pure rules — block codes, limits, grid-walk watchdog.
 * Test deploy: 5 new blocks per day per install (Erlan, 23.11: «даже 15 это много максимум 3-5»).
 * The same block again the same day is free. Pilot keys are issued to each person by hand (invite only).
 * Limits are counted three ways so that many installs do not add up: per install key, per browser
 * fingerprint and per network (/24 for IPv4, /48 for IPv6). No I/O here — unit-tested.
 */
import { createHash, createHmac } from 'crypto';

export const LIMITS = {
  keyPerDay: 5, // new blocks per install
  fpPerDay: 5, // new blocks per browser fingerprint (another key in the same browser does not reset it)
  netPerDay: 15, // new blocks per network: an office of three people
  newKeysPerNetDay: 3, // installs registered from one network per day
  newKeysPerFpDay: 2, // installs registered from one browser per day
  walkSteps: 8, // one-cell steps in one direction in a row → the key is switched off
} as const;

export const BLOCK_RE = /^([KLMN])-(3[89]|4[0-5])-(\d{1,3})-\(10([abvgde])-5([abvg])-(\d{1,2})\)$/;
const ROW = 'KLMN';
const L10 = 'abvgde';
const L5 = 'abvg';

/** Whole-minute cell indices of a block (x from 42°E, y from 40°N), or null for a bad code. */
export function blockMinutes(code: string): { mx: number; my: number } | null {
  const m = BLOCK_RE.exec(code);
  if (!m) return null;
  const n100 = +m[3];
  const n1 = +m[6];
  if (n100 < 1 || n100 > 144 || n1 < 1 || n1 > 25) return null;
  const sy = ROW.indexOf(m[1]);
  const sx = +m[2] - 38;
  const hy = 11 - Math.floor((n100 - 1) / 12);
  const hx = (n100 - 1) % 12;
  const i10 = L10.indexOf(m[4]);
  const ty = 1 - Math.floor(i10 / 3);
  const tx = i10 % 3;
  const i5 = L5.indexOf(m[5]);
  const fy = 1 - Math.floor(i5 / 2);
  const fx = i5 % 2;
  const cy = 4 - Math.floor((n1 - 1) / 5);
  const cx = (n1 - 1) % 5;
  return {
    mx: sx * 360 + hx * 30 + tx * 10 + fx * 5 + cx,
    my: sy * 240 + hy * 20 + ty * 10 + fy * 5 + cy,
  };
}

export function isBlockCode(code: string): boolean {
  return blockMinutes(code) !== null;
}

export function sheetOf(code: string): string {
  return code.split('-(')[0];
}

/** Blocks touch (share a side or a corner). */
export function adjacent(a: string, b: string): boolean {
  const p = blockMinutes(a);
  const q = blockMinutes(b);
  if (!p || !q || a === b) return false;
  return Math.abs(p.mx - q.mx) <= 1 && Math.abs(p.my - q.my) <= 1;
}

/**
 * Grid-walk watchdog. `codes` are a key's new blocks of the day, oldest first. A person checking a
 * licence area clicks a compact cluster in any order; a scraper steps cell by cell in one direction.
 * Trips on `walkSteps` consecutive one-cell steps in the same direction (a row or a column).
 */
export function isGridWalk(codes: string[]): boolean {
  const cells = codes.map(blockMinutes).filter((c): c is { mx: number; my: number } => !!c);
  let run = 0;
  for (let i = 2; i < cells.length; i++) {
    const dx = cells[i].mx - cells[i - 1].mx;
    const dy = cells[i].my - cells[i - 1].my;
    const px = cells[i - 1].mx - cells[i - 2].mx;
    const py = cells[i - 1].my - cells[i - 2].my;
    const step = Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0);
    run = step && dx === px && dy === py ? (run || 1) + 1 : 0;
    if (run >= LIMITS.walkSteps) return true;
  }
  return false;
}

/** Network of a client address: /24 for IPv4, /48 for IPv6. */
export function networkOf(ip: string): string {
  const v = ip.trim().replace(/^::ffff:/, '');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return v.split('.').slice(0, 3).join('.') + '.0/24';
  if (v.includes(':')) {
    const head = v.split('::')[0].split(':').filter(Boolean);
    return (head.slice(0, 3).join(':') || '0') + '::/48';
  }
  return 'unknown';
}

/** First address in x-forwarded-for (Vercel sets it), else x-real-ip. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Today in Almaty, YYYY-MM-DD: the free 15 reset at local midnight. */
export function almatyDay(now = new Date()): string {
  return new Date(now.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Salted per day: the stored value cannot be turned back into an address or followed across days. */
export function hashWithDay(secret: string, kind: string, value: string, day: string): string {
  return createHmac('sha256', secret).update(`${kind}|${day}|${value}`).digest('hex').slice(0, 32);
}

/** Hash of an install/pilot key (192-bit random, so a plain hash is enough); the data-repo key script computes the same. */
export function hashKey(value: string): string {
  return createHash('sha256').update(`qz-ext-key|${value}`).digest('hex').slice(0, 40);
}

export const KEY_RE = /^[A-Za-z0-9_-]{32,64}$/;
export const FP_RE = /^[a-f0-9]{16,64}$/;

export type Verdict =
  | { ok: true; repeat: boolean }
  | { ok: false; reason: 'key_limit' | 'fp_limit' | 'net_limit' };

/** Decide on one block view from today's distinct blocks already counted for key, fingerprint and network. */
export function decide(
  code: string,
  today: { key: Set<string>; fp: Set<string>; net: Set<string> }
): Verdict {
  if (today.key.has(code)) return { ok: true, repeat: true };
  if (today.key.size >= LIMITS.keyPerDay) return { ok: false, reason: 'key_limit' };
  if (!today.fp.has(code) && today.fp.size >= LIMITS.fpPerDay) return { ok: false, reason: 'fp_limit' };
  if (!today.net.has(code) && today.net.size >= LIMITS.netPerDay) return { ok: false, reason: 'net_limit' };
  return { ok: true, repeat: false };
}

export const NO_STORE = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' };
