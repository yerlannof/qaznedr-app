'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  MapPin,
  Building2,
  Briefcase,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  User,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function NavigationSimple() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get current locale from pathname
  const getCurrentLocale = () => {
    const segments = pathname.split('/');
    const locale = segments[1];
    return ['ru', 'kz', 'en', 'zh'].includes(locale) ? locale : 'ru';
  };

  const currentLocale = getCurrentLocale();

  const locales = [
    { code: 'ru', name: 'Русский' },
    { code: 'kz', name: 'Қазақша' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
  ];

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    const currentLocale = segments[1];

    // Replace the locale in the pathname
    if (['ru', 'kz', 'en', 'zh'].includes(currentLocale)) {
      segments[1] = newLocale;
    } else {
      segments.unshift('', newLocale);
    }

    const newPath = segments.join('/') || `/${newLocale}`;
    router.push(newPath);
    setIsLangOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${currentLocale}`}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              QAZNEDR
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href={`/${currentLocale}/listings`}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navigation.listings')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/map`}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navigation.map')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/services`}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>{t('navigation.services')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/companies`}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>{t('navigation.companies')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/messages`}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('navigation.messages')}</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">
                  {locales.find((l) => l.code === currentLocale)?.name ||
                    'Русский'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  {locales.map((locale) => (
                    <button
                      key={locale.code}
                      onClick={() => switchLanguage(locale.code)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                        currentLocale === locale.code
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {locale.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>

            {/* Create button */}
            <Link
              href={`/${currentLocale}/listings/create`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('navigation.createListing')}
            </Link>

            {/* User menu */}
            <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
