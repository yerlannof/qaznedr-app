'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  
  // Helper function to switch locale in current path
  const switchLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    if (segments[1] && ['ru', 'kz', 'en', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    return segments.join('/') || `/${newLocale}`;
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-4">
                {t('footer.company.name')}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t('footer.company.description')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{t('footer.contact.address')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+7 (727) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@qaznedr.kz</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {t('footer.quickLinks.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/listings`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.listings')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.services')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/companies`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.companies')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/map`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.map')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/news`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.quickLinks.news')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {t('footer.services.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/services/geological`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.services.geological')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/legal`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.services.legal')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/equipment`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.services.equipment')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/investors`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.services.investors')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {t('footer.legal.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/legal/terms`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/legal/privacy`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/support`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.legal.support')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {t('footer.legal.about')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <h5 className="text-sm font-semibold mb-2">
                {t('footer.language.title')}
              </h5>
              <div className="flex space-x-4">
                <Link
                  href={switchLocalePath('ru')}
                  className={`text-sm transition-colors ${locale === 'ru' ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
                >
                  Русский
                </Link>
                <Link
                  href={switchLocalePath('kz')}
                  className={`text-sm transition-colors ${locale === 'kz' ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
                >
                  Қазақша
                </Link>
                <Link
                  href={switchLocalePath('en')}
                  className={`text-sm transition-colors ${locale === 'en' ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
                >
                  English
                </Link>
                <Link
                  href={switchLocalePath('zh')}
                  className={`text-sm transition-colors ${locale === 'zh' ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
                >
                  中文
                </Link>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-400 mb-1">
                {t('footer.industry.regulatory')}
              </p>
              <p className="text-xs text-gray-400">
                {t('footer.industry.certified')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
            <div>{t('footer.copyright')}</div>
            <div className="mt-2 sm:mt-0">
              <span>{t('footer.poweredBy')} </span>
              <span className="text-blue-400">QAZNEDR.KZ</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
