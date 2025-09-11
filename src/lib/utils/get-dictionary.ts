import 'server-only';
import type { Locale } from './i18n.config';

const dictionaries = {
  en: () =>
    import('../../../public/locales/en/common.json').then(
      (module) => module.default
    ),
  ru: () =>
    import('../../../public/locales/ru/common.json').then(
      (module) => module.default
    ),
  kz: () =>
    import('../../../public/locales/kz/common.json').then(
      (module) => module.default
    ),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.en();
};
