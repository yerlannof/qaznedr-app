'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type Locale = 'ru' | 'kz' | 'en' | 'zh';
const locales: Locale[] = ['ru', 'kz', 'en', 'zh'];
const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  kz: 'Қазақша',
  en: 'English',
  zh: '中文',
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export default function LanguageSwitcher({
  currentLocale,
  className = '',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    if (locale === selectedLocale) {
      setIsOpen(false);
      return;
    }

    setSelectedLocale(locale);
    setIsOpen(false);

    // Replace the locale in the current path
    const segments = pathname.split('/');
    // Check if first segment is a locale
    if (segments[1] && locales.includes(segments[1] as Locale)) {
      segments[1] = locale;
    } else {
      // If no locale in path, add it
      segments.splice(1, 0, locale);
    }
    const newPath = segments.join('/') || `/${locale}`;

    router.push(newPath);
  };

  // Get locale flag emoji (temporary - should replace with flag icons)
  const getLocaleIcon = (locale: Locale) => {
    const icons: Record<Locale, string> = {
      ru: '🇷🇺',
      en: '🇬🇧',
      kz: '🇰🇿',
      zh: '🇨🇳',
    };
    return icons[locale];
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="hidden sm:inline">{localeNames[selectedLocale]}</span>
        <span className="sm:hidden">{selectedLocale.toUpperCase()}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="py-1">
              {locales.map((locale) => (
                <motion.button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
                    transition-colors
                    ${
                      selectedLocale === locale
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getLocaleIcon(locale)}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{localeNames[locale]}</span>
                      <span className="text-xs text-gray-500">
                        {locale.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {selectedLocale === locale && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <Check className="w-4 h-4 text-blue-600" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact({
  currentLocale,
  className = '',
}: LanguageSwitcherProps) {
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (locale: Locale) => {
    if (locale === selectedLocale) return;

    setSelectedLocale(locale);

    // Replace the locale in the current path
    const segments = pathname.split('/');
    segments[1] = locale;
    const newPath = segments.join('/') || `/${locale}`;

    router.push(newPath);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {locales.map((locale, index) => (
        <motion.button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`
            px-2 py-1 text-xs font-medium rounded transition-all
            ${
              selectedLocale === locale
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {locale.toUpperCase()}
        </motion.button>
      ))}
    </div>
  );
}
