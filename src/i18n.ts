import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale
  const locale = await requestLocale;
  
  // List of supported locales
  const locales = ['ru', 'kz', 'en', 'zh'];
  
  // Use 'ru' as fallback if locale is invalid
  const finalLocale = (locale && locales.includes(locale)) ? locale : 'ru';

  try {
    return {
      locale: finalLocale,
      messages: (await import(`./messages/${finalLocale}.json`)).default,
      timeZone: 'Asia/Almaty',
      now: new Date()
    };
  } catch (error) {
    // Fallback to Russian if there's any error
    return {
      locale: 'ru',
      messages: (await import(`./messages/ru.json`)).default,
      timeZone: 'Asia/Almaty',
      now: new Date()
    };
  }
});