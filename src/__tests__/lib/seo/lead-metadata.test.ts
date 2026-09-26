import {
  leadMineralName,
  leadRegionName,
  leadSeoText,
} from '@/lib/seo/lead-metadata';

const lead = {
  code: 'AU-508A4C',
  mineral: 'Au',
  region: 'Жамбылская',
  license_status: 'FREE_COORD_VERIFIED_2026',
};

describe('lead SEO text', () => {
  it('builds a Chinese title without Cyrillic', () => {
    const { title } = leadSeoText(lead, 'zh');
    expect(title).toBe('哈萨克斯坦江布尔金矿项目 AU-508A4C');
    expect(title).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('builds ru and en titles', () => {
    expect(leadSeoText(lead, 'ru').title).toBe(
      'Золото — участок AU-508A4C, Жамбылская область, Казахстан'
    );
    expect(leadSeoText(lead, 'en').title).toBe(
      'Gold Exploration Area AU-508A4C, Zhambyl, Kazakhstan'
    );
  });

  it('resolves region spellings used by the leads export', () => {
    expect(leadRegionName('ВКО', 'en')).toBe('East Kazakhstan');
    expect(leadRegionName('Семипалатинская/Абайская', 'zh')).toBe('阿拜');
    expect(leadRegionName('Костанай', 'kz')).toBe('Қостанай');
    expect(leadRegionName('Жетысуская', 'en')).toBe('Zhetysu');
  });

  it('never leaks an unknown Russian region into zh/en', () => {
    const x = { ...lead, region: 'Центральный Казахстан' };
    expect(leadSeoText(x, 'zh').title).toBe('哈萨克斯坦金矿项目 AU-508A4C');
    expect(leadSeoText(x, 'en').title).toBe(
      'Gold Exploration Area AU-508A4C, Kazakhstan'
    );
  });

  it('uses the free-area description only for FREE statuses', () => {
    expect(leadSeoText(lead, 'ru').description).toMatch(
      /свободен от лицензий/i
    );
    expect(
      leadSeoText({ ...lead, license_status: 'PENDING' }, 'ru').description
    ).toMatch(/Геология изучена нашими геологами/);
  });

  it('handles compound and annotated commodity values from the registry', () => {
    expect(leadMineralName('Pb-Zn', 'zh')).toBe('铅锌');
    expect(leadMineralName('Pb-Zn', 'ru')).toBe('Свинец-цинк');
    expect(leadMineralName('Au+Cu', 'en')).toBe('Gold-Copper');
    expect(leadMineralName('Au россыпь', 'ru')).toBe('Золото');
  });

  it('falls back to the raw mineral code and tolerates nulls', () => {
    expect(leadMineralName('REE', 'en')).toBe('REE');
    expect(() =>
      leadSeoText(
        { code: 'AU-1', mineral: null, region: null, license_status: null },
        'zh'
      )
    ).not.toThrow();
  });
});

describe('lead description check date', () => {
  it('states the check date for a free lead', () => {
    const { description } = leadSeoText(
      {
        code: 'AU-4',
        mineral: 'Au',
        region: 'Жамбылская',
        license_status: 'FREE_CONFIRMED',
        last_verified: null,
      },
      'ru'
    );
    expect(description).toContain('по нашей проверке на 05.2026');
    expect(description).not.toMatch(/портфел/i);
  });

  it('never claims ownership for a non-free lead', () => {
    const { description } = leadSeoText(
      { code: 'AU-9', mineral: 'Au', region: null, license_status: 'PENDING' },
      'en'
    );
    expect(description).not.toMatch(/portfolio/i);
  });
});
