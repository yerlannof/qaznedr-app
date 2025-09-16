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
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavigationSimple() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-800/50' 
          : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
      }`}>
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname === `/${currentLocale}/listings`
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navigation.listings')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/map`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname === `/${currentLocale}/map`
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navigation.map')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/services`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname === `/${currentLocale}/services`
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{t('navigation.services')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/companies`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname === `/${currentLocale}/companies`
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('navigation.companies')}</span>
            </Link>
            <Link
              href={`/${currentLocale}/messages`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname === `/${currentLocale}/messages`
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('navigation.messages')}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-3">
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
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Navigation Links */}
              {[
                { href: `/${currentLocale}/listings`, icon: MapPin, label: t('navigation.listings') },
                { href: `/${currentLocale}/map`, icon: MapPin, label: t('navigation.map') },
                { href: `/${currentLocale}/services`, icon: Briefcase, label: t('navigation.services') },
                { href: `/${currentLocale}/companies`, icon: Building2, label: t('navigation.companies') },
                { href: `/${currentLocale}/messages`, icon: MessageSquare, label: t('navigation.messages') },
              ].map((item) => (
                <motion.div key={item.href} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              {/* Mobile Language Selector */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('footer.language.title')}
                </div>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {locales.map((locale) => (
                    <motion.button
                      key={locale.code}
                      onClick={() => {
                        switchLanguage(locale.code);
                        setIsMobileMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentLocale === locale.code
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {locale.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Mobile Create Button */}
              <motion.div className="pt-2" whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/${currentLocale}/listings/create`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('navigation.createListing')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
