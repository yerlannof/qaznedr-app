import { getRequestConfig } from 'next-intl/server';
import ruMessages from '../messages/ru.json';
import kzMessages from '../messages/kz.json';
import enMessages from '../messages/en.json';
import zhMessages from '../messages/zh.json';

const messages: Record<string, any> = {
  ru: ruMessages,
  kz: kzMessages,
  en: enMessages,
  zh: zhMessages
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = 'ru';
  
  try {
    const requested = await requestLocale;
    if (requested && messages[requested]) {
      locale = requested;
    }
  } catch (error) {
    console.error('Error getting locale:', error);
  }

  return {
    locale,
    messages: messages[locale] || ruMessages
  };
});