import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['ru', 'en', 'kz', 'zh'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'ru';

// Locale display names
export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  kz: 'Қазақша',
  zh: '中文',
};

// Locale flags/icons
export const localeFlags: Record<Locale, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  kz: '🇰🇿',
  zh: '🇨🇳',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});