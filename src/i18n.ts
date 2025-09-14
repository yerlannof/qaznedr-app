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
  const locale = await requestLocale;
  const finalLocale = locale || 'ru';

  return {
    locale: finalLocale,
    messages: messages[finalLocale] || messages.ru
  };
});