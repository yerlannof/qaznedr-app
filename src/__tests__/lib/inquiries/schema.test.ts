import {
  inquirySchema,
  isLikelySpam,
  parseStatusFilter,
  parseStatusUpdate,
} from '@/lib/inquiries/schema';

const valid = {
  name: 'Li Wei',
  channel: 'wechat',
  contact: 'liwei_88',
  locale: 'zh',
  leadCode: 'AU-508A4C',
  elapsedMs: 8000,
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

  it('accepts bounded attribution fields and rejects URLs or oversized values', () => {
    expect(
      inquirySchema.parse({
        ...valid,
        utm: { landing_path: '/zh/leads', referrer_host: 'www.baidu.com' },
      }).utm
    ).toEqual({ landing_path: '/zh/leads', referrer_host: 'www.baidu.com' });
    for (const utm of [
      { landing_path: 'https://site/path?x=1' },
      { landing_path: '/zh/contact?email=a' },
      { landing_path: '/zh/contact/private-email' },
      { landing_path: '/' + 'x'.repeat(301) },
      { referrer_host: 'site.com/path' },
      { referrer_host: 'x'.repeat(254) },
    ]) {
      expect(inquirySchema.safeParse({ ...valid, utm }).success).toBe(false);
    }
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

describe('fill timer', () => {
  it('requires elapsedMs', () => {
    const { elapsedMs, ...noTimer } = valid;
    expect(elapsedMs).toBe(8000);
    expect(inquirySchema.safeParse(noTimer).success).toBe(false);
  });
});

describe('admin status input', () => {
  const id = '3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b';

  it('accepts a uuid and a known status', () => {
    expect(parseStatusUpdate({ id, status: 'REJECTED' })).toEqual({
      id,
      status: 'REJECTED',
    });
  });

  it('rejects a non-uuid id or an unknown status', () => {
    expect(parseStatusUpdate({ id: '42', status: 'REJECTED' })).toBeNull();
    expect(parseStatusUpdate({ id, status: 'LOST' })).toBeNull();
    expect(parseStatusUpdate(null)).toBeNull();
  });

  it('parses the list filter', () => {
    expect(parseStatusFilter(null)).toBe('NEW');
    expect(parseStatusFilter('ALL')).toBe('ALL');
    expect(parseStatusFilter('DEAL')).toBe('DEAL');
    expect(parseStatusFilter('drop table')).toBeNull();
  });
});
