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
  'leadsHero.subtitle',
];

describe.each(['ru', 'kz', 'en', 'zh'])('%s copy', (locale) => {
  it.each(KEYS)('%s qualifies "free"', (key) => {
    const value = translate(locale, key);
    expect(
      FREE[locale].test(value) ? QUALIFIED[locale].test(value) : true
    ).toBe(true);
  });
});
