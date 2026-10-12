/** @jest-environment node */
import { readFileSync } from 'fs';
import { articlePath } from '@/lib/insights/content';

const guides = [
  'foreign-investor-subsoil-rights-kazakhstan',
  'solid-minerals-exploration-licence-kazakhstan',
  'subsoil-rights-transfer-permission-kazakhstan',
] as const;
const locales = ['ru', 'kz', 'en', 'zh'] as const;
const checkedFreeArea = {
  ru: /свободн[а-я]* по нашей проверке/,
  kz: /тексеруіміз бойынша бос/,
  en: /free according to our check/,
  zh: /核查.*空白/,
} as const;

it.each(
  guides.flatMap((guide) => locales.map((locale) => [guide, locale] as const))
)(
  'links the checked free areas in %s (%s) to the finds facet',
  (guide, locale) => {
    const markdown = readFileSync(articlePath(guide, locale), 'utf8');
    const contextualLines = markdown
      .split('\n')
      .filter(
        (line) =>
          checkedFreeArea[locale].test(line) &&
          line.includes(`/${locale}/leads`)
      );

    expect(contextualLines).toHaveLength(1);
    expect(contextualLines[0]).toMatch(
      new RegExp(`\\[[^\\]]+\\]\\(/${locale}/leads\\?kind=find\\)`)
    );
  }
);

it.each(locales)(
  'keeps the general catalogue CTA in the transfer guide (%s)',
  (locale) => {
    const markdown = readFileSync(
      articlePath('subsoil-rights-transfer-permission-kazakhstan', locale),
      'utf8'
    );
    const generalCta = markdown
      .split('\n')
      .find(
        (line) =>
          line.includes(`/${locale}/contact`) &&
          line.includes(`/${locale}/leads`)
      );

    expect(generalCta).toBeDefined();
    expect(generalCta).toMatch(
      new RegExp(`\\[[^\\]]+\\]\\(/${locale}/leads\\)`)
    );
  }
);
