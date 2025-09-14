import { getRequestConfig } from 'next-intl/server';
import { locales } from './src/i18n/config';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as any)) {
    return {
      locale: 'ru',
      messages: (await import(`../../messages/ru.json`)).default,
    };
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});