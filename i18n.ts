import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate locale exists
  if (!locale) {
    throw new Error('Locale is required');
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});