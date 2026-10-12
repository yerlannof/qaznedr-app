import { translations } from '@/lib/i18n/translations';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>(
    (acc, [k, v]) =>
      typeof v === 'string'
        ? { ...acc, [`${prefix}${k}`]: v }
        : { ...acc, ...flatten(v, `${prefix}${k}.`) },
    {}
  );
}

const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;
const copy = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    flatten((translations[l] as unknown as { prospecting: Tree }).prospecting),
  ])
) as Record<(typeof LOCALES)[number], Record<string, string>>;
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe.each(LOCALES)('%s prospecting copy', (locale) => {
  it('has every Russian key', () => {
    expect(Object.keys(copy[locale]).sort()).toEqual(
      Object.keys(copy.ru).sort()
    );
  });

  it.each(Object.keys(copy.ru))('%s keeps the placeholders', (key) => {
    expect(copy[locale][key].trim().length).toBeGreaterThan(0);
    expect(placeholders(copy[locale][key])).toEqual(placeholders(copy.ru[key]));
  });
});

// Subsoil Code art. 263(4): the right is neither sold nor transferred, the
// holding does not own the plots and promises no output (copy red lines).
const FORBIDDEN: Record<(typeof LOCALES)[number], RegExp[]> = {
  ru: [
    /продаж[аеу]\s+(лицензи|участк|прав)/i,
    /аренд/i,
    /уступк/i,
    /наш(и|его|ему|им|ем)?\s+участ/i,
    /гарантир(ует|уем|ованн)/i,
  ],
  kz: [/біздің\s+учаске/i, /жалға/i],
  en: [
    /\bfor sale\b/i,
    /\blease\b/i,
    /\bour\s+(plots?|areas?|sites?)\b/i,
    /\bguaranteed\s+(output|returns?|gold|income)\b/i,
  ],
  zh: [/出售许可证/, /租赁/, /我们的(矿区|地块|矿)/, /保证(收益|产量)/],
};

describe.each(LOCALES)('%s prospecting red lines', (locale) => {
  it.each(Object.entries(copy[locale]))('%s', (_key, value) => {
    for (const pattern of FORBIDDEN[locale]) {
      expect(value).not.toMatch(pattern);
    }
  });
});

it('states in every language that the right is not sold or transferred', () => {
  expect(copy.ru.disclaimer).toMatch(/не продаётся и не передаётся/);
  expect(copy.kz.disclaimer).toMatch(/сатылмайды және берілмейді/);
  expect(copy.en.disclaimer).toMatch(/not sold or transferred/);
  expect(copy.zh.disclaimer).toMatch(/不出售、不转让/);
});

// Owner 2026-10-12: holders look for partners, not crews.
const CREW: Record<(typeof LOCALES)[number], RegExp> = {
  ru: /бригад/i,
  kz: /бригада/i,
  en: /\bcrews?\b/i,
  zh: /作业队/,
};

it.each(LOCALES)('%s prospecting copy speaks of partners, not crews', (l) => {
  const grid = (translations[l] as unknown as { catalogGrid: Tree })
    .catalogGrid;
  for (const value of [
    ...Object.values(copy[l]),
    ...Object.values(flatten(grid)),
  ]) {
    expect(value).not.toMatch(CREW[l]);
  }
  expect(copy[l].statusOpen.length).toBeGreaterThan(0);
});
