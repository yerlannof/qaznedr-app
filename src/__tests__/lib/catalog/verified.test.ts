import { VERIFIED, verifiedOn } from '@/lib/catalog/verified';

it('starts with nothing verified until the owner names codes', () => {
  expect(verifiedOn('QN-P07')).toBeNull();
});

it('stores only public codes with ISO dates', () => {
  for (const [code, date] of Object.entries(VERIFIED)) {
    expect(code).toMatch(/^QN-(A|P)?\d{2,}$/);
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
});
