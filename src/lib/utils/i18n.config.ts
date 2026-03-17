export const i18nConfig = {
  locales: ['en', 'ru', 'kz', 'zh'],
  defaultLocale: 'en',
  localeLabels: {
    en: 'English',
    ru: 'Русский',
    kz: 'Қазақша',
    zh: '中文',
  },
} as const;

export type Locale = (typeof i18nConfig)['locales'][number];
