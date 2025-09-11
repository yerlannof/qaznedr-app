'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Locale } from '@/lib/utils/i18n.config';

type Dictionary = Record<string, string | Record<string, string>>;

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: Dictionary;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale,
  initialDictionary,
}: {
  children: ReactNode;
  initialLocale: Locale;
  initialDictionary: Dictionary;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [dictionary, setDictionary] = useState(initialDictionary);

  const handleSetLocale = async (newLocale: Locale) => {
    setLocale(newLocale);
    // Update the dictionary
    const response = await fetch(`/locales/${newLocale}/common.json`);
    const newDictionary = await response.json();
    setDictionary(newDictionary);
    // Store preference
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
  };

  return (
    <I18nContext.Provider
      value={{ locale, setLocale: handleSetLocale, dictionary }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
