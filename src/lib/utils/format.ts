/**
 * Centralized formatting utilities for the entire application
 * Ensures consistent formatting across all components
 */

/**
 * Format price in Tenge (₸) with proper grouping
 */
export const formatPrice = (price: number | null): string => {
  if (!price) return 'По запросу';

  if (price >= 1000000000000) {
    return `${(price / 1000000000000).toFixed(1)} трлн ₸`;
  } else if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} млрд ₸`;
  } else if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн ₸`;
  } else {
    return `${price.toLocaleString('ru-RU')} ₸`;
  }
};

/**
 * Format price in different currencies based on locale
 */
export const formatPriceWithCurrency = (
  price: number | null,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  if (!price) {
    const noPrice = {
      ru: 'По запросу',
      en: 'Price on request',
      kz: 'Сұрау бойынша',
      zh: '价格面议',
    };
    return noPrice[locale];
  }

  const currency = {
    ru: '₸',
    en: '$',
    kz: '₸',
    zh: '¥',
  };

  const exchangeRate = {
    ru: 1,
    en: 0.0022, // 1 KZT = 0.0022 USD (approximate)
    kz: 1,
    zh: 0.016, // 1 KZT = 0.016 CNY (approximate)
  };

  const convertedPrice = price * exchangeRate[locale];
  const currencySymbol = currency[locale];

  if (convertedPrice >= 1000000000) {
    const billions = {
      ru: 'млрд',
      en: 'B',
      kz: 'млрд',
      zh: '亿',
    };
    return `${(convertedPrice / 1000000000).toFixed(1)} ${billions[locale]} ${currencySymbol}`;
  } else if (convertedPrice >= 1000000) {
    const millions = {
      ru: 'млн',
      en: 'M',
      kz: 'млн',
      zh: '万',
    };
    return `${(convertedPrice / 1000000).toFixed(1)} ${millions[locale]} ${currencySymbol}`;
  } else {
    return `${convertedPrice.toLocaleString()} ${currencySymbol}`;
  }
};

/**
 * Format area in square kilometers
 */
export const formatArea = (area: number): string => {
  if (area >= 10000) {
    return `${(area / 1000).toFixed(0)} тыс. км²`;
  }
  return `${area.toLocaleString('ru-RU')} км²`;
};

/**
 * Format date in Russian locale by default
 */
export const formatDate = (
  date: string | Date,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  const d = new Date(date);
  const localeMap = {
    ru: 'ru-RU',
    en: 'en-US',
    kz: 'kk-KZ',
    zh: 'zh-CN',
  };

  return d.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format short date (for tables and cards)
 */
export const formatShortDate = (
  date: string | Date,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  const d = new Date(date);
  const localeMap = {
    ru: 'ru-RU',
    en: 'en-US',
    kz: 'kk-KZ',
    zh: 'zh-CN',
  };

  return d.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (
  date: string | Date,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = {
    ru: {
      year: ['год', 'года', 'лет'],
      month: ['месяц', 'месяца', 'месяцев'],
      week: ['неделя', 'недели', 'недель'],
      day: ['день', 'дня', 'дней'],
      hour: ['час', 'часа', 'часов'],
      minute: ['минута', 'минуты', 'минут'],
    },
    en: {
      year: ['year', 'years'],
      month: ['month', 'months'],
      week: ['week', 'weeks'],
      day: ['day', 'days'],
      hour: ['hour', 'hours'],
      minute: ['minute', 'minutes'],
    },
    kz: {
      year: ['жыл', 'жыл'],
      month: ['ай', 'ай'],
      week: ['апта', 'апта'],
      day: ['күн', 'күн'],
      hour: ['сағат', 'сағат'],
      minute: ['минут', 'минут'],
    },
    zh: {
      year: ['年', '年'],
      month: ['月', '月'],
      week: ['周', '周'],
      day: ['天', '天'],
      hour: ['小时', '小时'],
      minute: ['分钟', '分钟'],
    },
  };

  const seconds = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(seconds)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit);
    if (interval >= 1) {
      if (locale === 'ru') {
        const forms = intervals.ru[unit as keyof typeof intervals.ru];
        const form = getPlural(interval, forms);
        return `${interval} ${form} назад`;
      } else if (locale === 'zh') {
        return `${interval}${intervals.zh[unit as keyof typeof intervals.zh][0]}前`;
      } else if (locale === 'kz') {
        return `${interval} ${intervals.kz[unit as keyof typeof intervals.kz][0]} бұрын`;
      } else {
        const form =
          interval === 1
            ? intervals.en[unit as keyof typeof intervals.en][0]
            : intervals.en[unit as keyof typeof intervals.en][1];
        return `${interval} ${form} ago`;
      }
    }
  }

  const justNow = {
    ru: 'только что',
    en: 'just now',
    kz: 'жаңа ғана',
    zh: '刚刚',
  };

  return justNow[locale];
};

/**
 * Helper function for Russian plural forms
 */
function getPlural(n: number, forms: string[]): string {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with proper grouping
 */
export const formatNumber = (
  value: number,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  const localeMap = {
    ru: 'ru-RU',
    en: 'en-US',
    kz: 'kk-KZ',
    zh: 'zh-CN',
  };

  return value.toLocaleString(localeMap[locale]);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';

  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format mineral reserves
 */
export const formatReserves = (
  amount: number,
  unit: string,
  locale: 'ru' | 'en' | 'kz' | 'zh' = 'ru'
): string => {
  const units = {
    ru: {
      tons: 'тонн',
      barrels: 'баррелей',
      m3: 'м³',
      kg: 'кг',
      carats: 'карат',
    },
    en: {
      tons: 'tons',
      barrels: 'barrels',
      m3: 'm³',
      kg: 'kg',
      carats: 'carats',
    },
    kz: {
      tons: 'тонна',
      barrels: 'баррель',
      m3: 'м³',
      kg: 'кг',
      carats: 'карат',
    },
    zh: {
      tons: '吨',
      barrels: '桶',
      m3: '立方米',
      kg: '公斤',
      carats: '克拉',
    },
  };

  const localizedUnit = units[locale][unit as keyof typeof units.ru] || unit;

  if (amount >= 1000000) {
    const millions = {
      ru: 'млн',
      en: 'M',
      kz: 'млн',
      zh: '百万',
    };
    return `${(amount / 1000000).toFixed(1)} ${millions[locale]} ${localizedUnit}`;
  } else if (amount >= 1000) {
    const thousands = {
      ru: 'тыс.',
      en: 'K',
      kz: 'мың',
      zh: '千',
    };
    return `${(amount / 1000).toFixed(1)} ${thousands[locale]} ${localizedUnit}`;
  }

  return `${amount.toLocaleString()} ${localizedUnit}`;
};
