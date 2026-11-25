/** @jest-environment node */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { calc, minSpend, feeYear } = require('../../../../extension/qaznedr-block/cost.js');

// Reference numbers: LICENSE_MONEY.md of 06.10.2026 (license_money.py, research repo), MRP 2026 = 4 325.
describe('licence cost calculator', () => {
  test('money on account at filing = year-1 minimum spend (art. 192 p.2)', () => {
    expect([1, 3, 8, 15, 20, 25].map((n) => calc(n).account)).toEqual([1200, 1800, 2300, 2900, 3500, 4100]);
  });
  test('liquidation security 720 MRP per block, bonus 100', () => {
    expect(calc(15).security).toBe(10800);
    expect(calc(1).bonus).toBe(100);
  });
  test('six-year totals match the reference table (million tenge)', () => {
    const mln = (mrp: number) => Math.round(mrp * 4325 / 1e4) / 100;
    expect(mln(calc(15).spend6)).toBe(94.72);
    expect(mln(calc(15).fee6)).toBe(7.98);
    expect(mln(calc(20).total6)).toBe(125.25);
    expect(mln(calc(25).total6)).toBe(147.37);
  });
  test('block fee: year 6 straddles month 61 (rate 23 → 32)', () => {
    expect(feeYear(1, 15)).toBe(225);
    expect(feeYear(6, 15)).toBe(480);
  });
  test('extension: 40 % only from 10 blocks', () => {
    expect(calc(15).ext.keep).toBe(9);
    expect(calc(25).ext.keep).toBe(15);
    expect(calc(5).ext.keep).toBe(5);
    expect(minSpend(7, 9)).toBe(5800);
  });
  test('block count is clamped to 1..200', () => {
    expect(calc(0).n).toBe(1);
    expect(calc(999).n).toBe(200);
    expect(calc('abc').n).toBe(1);
  });
});
