import { getRequestConfig } from 'next-intl/server';

// Define locales directly to avoid import issues during build
const locales = ['ru', 'kz', 'en', 'zh'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as any)) {
    return {
      locale: 'ru' as const,
      messages: (await import(`./messages/ru.json`)).default,
    };
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});