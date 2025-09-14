import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale exists
  if (!locale || !locales.includes(locale as any)) {
    throw new Error('Invalid locale');
  }
  
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});