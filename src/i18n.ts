import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  return {
    locale: locale || 'ru',
    messages: (await import(`../messages/${locale || 'ru'}.json`)).default
  };
});