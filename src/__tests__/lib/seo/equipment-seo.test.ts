import {
  appendExcerpt,
  listingCanonicalUrl,
  listingSourceLocale,
} from '@/lib/seo/equipment-seo';

describe('listing language', () => {
  it('uses the recorded source language, Russian otherwise', () => {
    expect(listingSourceLocale({})).toBe('ru');
    expect(listingSourceLocale({ sourceLanguage: 'zh' })).toBe('zh');
    expect(listingSourceLocale({ sourceLanguage: 'de' })).toBe('ru');
    expect(listingCanonicalUrl({ id: 'x', sourceLanguage: 'kz' })).toBe(
      'https://qaznedr.kz/kz/equipment/x'
    );
  });
});

describe('appendExcerpt', () => {
  const prefix = 'Услуги и работы · Буровые работы · Алматы · Цена по запросу';

  it('appends the whole text when it fits, with whitespace collapsed', () => {
    expect(
      appendExcerpt(prefix, '  Бурим\n\nскважины   глубиной до 300 м. ')
    ).toBe(`${prefix} · Бурим скважины глубиной до 300 м.`);
  });

  it('cuts at a word boundary within 160 characters', () => {
    const text = 'Колонковое бурение '.repeat(20);
    const out = appendExcerpt(prefix, text);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.startsWith(`${prefix} · Колонковое бурение`)).toBe(true);
    expect(out).toMatch(/(Колонковое|бурение)…$/);
  });

  it('drops punctuation left at the cut', () => {
    const out = appendExcerpt('П', `${'слово, '.repeat(40)}конец`);
    expect(out).toMatch(/слово…$/);
    expect(out.length).toBeLessThanOrEqual(160);
  });

  it('keeps the prefix alone when there is no text or no room for a word', () => {
    expect(appendExcerpt(prefix, undefined)).toBe(prefix);
    expect(appendExcerpt(prefix, '   ')).toBe(prefix);
    const long = 'x'.repeat(158);
    expect(appendExcerpt(long, 'Слово')).toBe(long);
    expect(appendExcerpt(prefix, 'О'.repeat(200))).toBe(prefix);
  });
});
