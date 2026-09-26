import { inquirySchema, isLikelySpam } from '@/lib/inquiries/schema';

const valid = {
  name: 'Li Wei',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
};

describe('inquirySchema', () => {
  it('accepts minimal input and fills defaults', () => {
    const r = inquirySchema.parse(valid);
    expect(r).toMatchObject({ company: '', message: '', website: '' });
  });

  it('trims text fields', () => {
    expect(inquirySchema.parse({ ...valid, name: '  Li  ' }).name).toBe('Li');
  });

  it.each([
    { ...valid, name: '   ' },
    { ...valid, channel: 'fax' },
    { ...valid, contact: 'ab' },
    { ...valid, locale: 'de' },
    { ...valid, leadCode: 'DROP TABLE' },
    { ...valid, message: 'x'.repeat(2001) },
  ])('rejects invalid input #%#', (input) => {
    expect(inquirySchema.safeParse(input).success).toBe(false);
  });

  // Real published codes are as short as AU-4; the leads schema also allows
  // multi-part codes like AU-CLUSTER-308.
  it.each(['AU-4', 'AU-31', 'AU-508A4C', 'AU-CLUSTER-308'])(
    'accepts real lead code %s',
    (leadCode) => {
      expect(inquirySchema.safeParse({ ...valid, leadCode }).success).toBe(
        true
      );
    }
  );

  it('keeps only known utm fields', () => {
    const r = inquirySchema.parse({
      ...valid,
      utm: { source: 'baidu', evil: 'x' },
    });
    expect(r.utm).toEqual({ source: 'baidu' });
  });
});

describe('isLikelySpam', () => {
  it('flags a filled honeypot or a too-fast submit', () => {
    expect(isLikelySpam(inquirySchema.parse({ ...valid, website: 'x' }))).toBe(
      true
    );
    expect(
      isLikelySpam(inquirySchema.parse({ ...valid, elapsedMs: 500 }))
    ).toBe(true);
    expect(
      isLikelySpam(inquirySchema.parse({ ...valid, elapsedMs: 8000 }))
    ).toBe(false);
    expect(isLikelySpam(inquirySchema.parse(valid))).toBe(false);
  });
});
