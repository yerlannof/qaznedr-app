import {
  parseShowcase,
  pickText,
  pickList,
  splitHeadline,
  formatRightsDate,
} from '@/lib/leads/showcase';

const valid = {
  package: 'qaznedr-showcase-v1',
  card_id: 'QN-98',
  commodity: ['Cu'],
  oblast: { ru: 'Павлодарская область', en: 'Pavlodar Region' },
  zone: { center_lat: 49.0, center_lon: 72.0, radius_km: 50 },
  headline: { ru: 'Среднее содержание: медь 0,50 %' },
  headline_type: 'average',
  object_type: { ru: 'рудопроявление' },
  facts: { ru: ['Первый факт', 'Второй факт'], en: ['First fact'] },
  source: { ru: 'Источник: фондовый геологический отчёт' },
  images: [
    {
      url: 'https://example.supabase.co/storage/v1/object/public/showcase/v1/img/QN-98_1.webp',
      caption: { ru: 'Фрагмент архивного отчёта, названия скрыты' },
      width: 1500,
      height: 300,
      v: 'cccccccccccc',
    },
  ],
  rights: {
    status: { ru: 'Свободен (наша проверка по карте)' },
    checked_at: '2026-09-28',
  },
  whatsapp_text: {
    ru: 'Здравствуйте! Интересует карточка QN-98 с сайта qaznedr.kz.',
  },
};

describe('parseShowcase', () => {
  it('accepts a complete card', () => {
    expect(parseShowcase(valid)?.card_id).toBe('QN-98');
  });

  it('rejects missing data instead of rendering a partial card', () => {
    expect(parseShowcase(null)).toBeNull();
    expect(parseShowcase({ ...valid, headline_type: 'grade' })).toBeNull();
    expect(
      parseShowcase({ ...valid, zone: { center_lat: 49, center_lon: 72 } })
    ).toBeNull();
    expect(
      parseShowcase({ ...valid, rights: { status: { ru: 'x' } } })
    ).toBeNull();
    expect(
      parseShowcase({ ...valid, headline: { en: 'no russian source' } })
    ).toBeNull();
  });

  it('rejects image dimensions that cannot reserve space', () => {
    const bad = { ...valid, images: [{ ...valid.images[0], width: 0 }] };
    expect(parseShowcase(bad)).toBeNull();
  });
});

describe('localized values', () => {
  it('uses the locale text when present', () => {
    expect(pickText(valid.oblast, 'en')).toEqual({
      text: 'Pavlodar Region',
      lang: undefined,
    });
  });

  it('falls back to Russian and marks the language', () => {
    expect(pickText(valid.oblast, 'zh')).toEqual({
      text: 'Павлодарская область',
      lang: 'ru',
    });
  });

  it('never mixes a partial translated fact list with the source list', () => {
    expect(pickList(valid.facts, 'en')).toEqual({
      items: ['Первый факт', 'Второй факт'],
      lang: 'ru',
    });
    expect(pickList({ ru: ['a', 'b'], kz: ['а', 'б'] }, 'kz')).toEqual({
      items: ['а', 'б'],
      lang: undefined,
    });
  });
});

describe('splitHeadline', () => {
  it('keeps every word: type before the first colon, value after it', () => {
    expect(
      splitHeadline('Максимум в отдельной пробе: золото до 9,9 г/т')
    ).toEqual({
      type: 'Максимум в отдельной пробе:',
      value: 'золото до 9,9 г/т',
    });
  });

  it('handles the full-width Chinese colon', () => {
    expect(splitHeadline('单个样品最高值：金 最高 9.9 克/吨')).toEqual({
      type: '单个样品最高值：',
      value: '金 最高 9.9 克/吨',
    });
  });

  it('leaves a headline without a colon whole', () => {
    expect(splitHeadline('медь 0,50 %')).toEqual({
      type: '',
      value: 'медь 0,50 %',
    });
  });
});

it('prints the rights date as DD.MM.YYYY', () => {
  expect(formatRightsDate('2026-09-28')).toBe('28.09.2026');
});
