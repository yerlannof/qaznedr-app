import { translate } from '@/lib/i18n/translations';

// "Free" is always "free per our check" (pivot spec §3, copy red lines).
const FREE: Record<string, RegExp> = {
  ru: /свобод/i,
  kz: /(^|[^а-яёәғқңөұүһі])бос([^а-яёәғқңөұүһі]|$)/i,
  en: /\bfree\b/i,
  zh: /空白|未设矿权/,
};
const QUALIFIED: Record<string, RegExp> = {
  ru: /по нашей проверке/,
  kz: /тексеруімізше/,
  en: /per our check/,
  zh: /我方核查/,
};
const KEYS = [
  'seo.site.description',
  'seo.home.description',
  'seo.leads.description',
  'portal.subtitle',
  'leadsHero.title',
  'leadsHero.subtitle',
  'showcase.contactNote',
];

describe.each(['ru', 'kz', 'en', 'zh'])('%s copy', (locale) => {
  it.each(KEYS)('%s qualifies "free"', (key) => {
    const value = translate(locale, key);
    expect(
      FREE[locale].test(value) ? QUALIFIED[locale].test(value) : true
    ).toBe(true);
  });
});

// The holding selects areas and takes on licensing for a buyer; it does not
// own them (pivot spec red line 1, geobase showcase contract).
const OWNERSHIP: Record<string, RegExp> = {
  ru: /наш(и|его|ему|им|ем)?\s+участ|участ\S*\s+(холдинга|наш)/i,
  kz: /біздің\s+учаске/i,
  en: /\bour\s+(areas?|sites?|plots?|deposits?)\b/i,
  zh: /我们的(矿区|地块|矿)/,
};

describe.each(['ru', 'kz', 'en', 'zh'])('%s ownership', (locale) => {
  it.each(KEYS)('%s never claims the areas as ours', (key) => {
    expect(translate(locale, key)).not.toMatch(OWNERSHIP[locale]);
  });
});
