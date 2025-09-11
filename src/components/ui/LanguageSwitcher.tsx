'use client';

import { useI18n } from '@/contexts';
import { i18nConfig, type Locale } from '@/lib/utils/i18n.config';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative inline-block text-left">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {i18nConfig.locales.map((lng) => (
          <option key={lng} value={lng}>
            {i18nConfig.localeLabels[lng]}
          </option>
        ))}
      </select>
    </div>
  );
}
