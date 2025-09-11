export const i18nConfig = {
  locales: ['en', 'ru', 'kz'],
  defaultLocale: 'en',
  localeLabels: {
    en: 'English',
    ru: 'Русский',
    kz: 'Қазақша',
  },
} as const;

export type Locale = (typeof i18nConfig)['locales'][number];
