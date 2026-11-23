/** @jest-environment node */
import {
  LIMITS,
  adjacent,
  almatyDay,
  blockMinutes,
  decide,
  isBlockCode,
  isGridWalk,
  networkOf,
} from '@/lib/ext-block/rules';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { blockCode } = require('../../../../extension/qaznedr-block/block-code.js');

const codeAt = (mx: number, my: number) => blockCode(42 + (mx + 0.5) / 60, 40 + (my + 0.5) / 60);

describe('block codes', () => {
  it('decodes back to the minute cell the extension encoded (5 000 cells)', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 5000; i++) {
      const mx = Math.floor(rnd() * 2880);
      const my = Math.floor(rnd() * 960);
      expect(blockMinutes(codeAt(mx, my))).toEqual({ mx, my });
    }
  });
  it('knows the portal example and refuses junk', () => {
    expect(blockCode(82.41154, 48.4998)).toBe('M-44-129-(10e-5a-5)');
    expect(isBlockCode('M-44-129-(10e-5a-5)')).toBe(true);
    expect(isBlockCode('M-44-145-(10e-5a-5)')).toBe(false);
    expect(isBlockCode('M-44-129-(10e-5a-26)')).toBe(false);
    expect(isBlockCode("M-44-129-(10e-5a-5)' or 1=1")).toBe(false);
  });
  it('adjacency crosses sheet borders', () => {
    expect(adjacent(codeAt(359, 100), codeAt(360, 101))).toBe(true);
    expect(adjacent(codeAt(359, 100), codeAt(361, 100))).toBe(false);
  });
});

describe('limits', () => {
  it('is the test-deploy limit: 5 a day per install (Erlan 23.11)', () => {
    expect(LIMITS.keyPerDay).toBe(5);
    expect(LIMITS.fpPerDay).toBe(5);
  });
  const none = () => ({ key: new Set<string>(), fp: new Set<string>(), net: new Set<string>() });
  const fill = (n: number) => new Set(Array.from({ length: n }, (_, i) => codeAt(i * 7, 5)));

  it('gives 5 new blocks a day, repeats are free', () => {
    const t = none();
    t.key = fill(LIMITS.keyPerDay);
    expect(decide(codeAt(1000, 500), t)).toEqual({ ok: false, reason: 'key_limit' });
    expect(decide([...t.key][2], t)).toEqual({ ok: true, repeat: true });
    t.key = fill(LIMITS.keyPerDay - 1);
    expect(decide(codeAt(1000, 500), t)).toEqual({ ok: true, repeat: false });
  });
  it('a fresh key in the same browser does not reset the day', () => {
    const t = none();
    t.fp = fill(LIMITS.fpPerDay);
    expect(decide(codeAt(1000, 500), t)).toEqual({ ok: false, reason: 'fp_limit' });
  });
  it('many browsers on one network stop at the network cap', () => {
    const t = none();
    t.net = fill(LIMITS.netPerDay);
    expect(decide(codeAt(1000, 500), t)).toEqual({ ok: false, reason: 'net_limit' });
  });
});

describe('grid-walk watchdog', () => {
  it('trips on a row walk and a column walk', () => {
    expect(isGridWalk(Array.from({ length: 9 }, (_, i) => codeAt(100 + i, 300)))).toBe(true);
    expect(isGridWalk(Array.from({ length: 9 }, (_, i) => codeAt(100, 300 - i)))).toBe(true);
    expect(isGridWalk(Array.from({ length: 7 }, (_, i) => codeAt(100 + i, 300)))).toBe(false);
  });
  it('stays quiet for a 4×3 licence area clicked row by row', () => {
    const area: string[] = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) area.push(codeAt(200 + x, 50 + y));
    expect(isGridWalk(area)).toBe(false);
  });
  it('stays quiet for scattered looks and a small cluster', () => {
    expect(isGridWalk(Array.from({ length: 12 }, (_, i) => codeAt(100 + i * 9, 300 + (i % 3) * 7)))).toBe(false);
    const cluster = [codeAt(10, 10), codeAt(11, 10), codeAt(10, 11), codeAt(11, 11)];
    expect(isGridWalk([...cluster, ...Array.from({ length: 8 }, (_, i) => codeAt(400 + i * 20, 600))])).toBe(false);
  });
});

describe('network and day', () => {
  it('cuts IPv4 to /24 and IPv6 to /48', () => {
    expect(networkOf('95.56.12.200')).toBe('95.56.12.0/24');
    expect(networkOf('::ffff:95.56.12.7')).toBe('95.56.12.0/24');
    expect(networkOf('2a00:1fa0:4a2:1234::1')).toBe('2a00:1fa0:4a2::/48');
  });
  it('rolls the day at Almaty midnight', () => {
    expect(almatyDay(new Date('2026-11-23T18:59:00Z'))).toBe('2026-11-23');
    expect(almatyDay(new Date('2026-11-23T19:00:00Z'))).toBe('2026-11-24');
  });
});
