'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Footer() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();

  const switchLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    if (segments[1] && ['ru', 'kz', 'en', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    return segments.join('/') || `/${newLocale}`;
  };

  const languages = [
    { code: 'ru', label: 'Русский' },
    { code: 'kz', label: 'Қазақша' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
  ];

  return (
    <footer className="md:mb-0 mb-14 bg-white border-t border-gray-200 dark:bg-[#0A0A0A] dark:border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold tracking-tight text-gray-900 dark:text-white text-lg mb-3">
              QAZNEDR
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('footer.company.description')}
            </p>
          </div>

          {/* Column 2: Платформа */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              {t('footerNav.platform.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/leads`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.platform.leads')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/listings`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.platform.listings')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.platform.services')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/companies`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.platform.companies')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/map`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.platform.map')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Информация */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              {t('footerNav.info.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.info.about')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/support`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.info.contacts')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/legal/terms`}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('footerNav.info.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Язык + ThemeToggle */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              {t('footer.language.title')}
            </h4>
            <ul className="space-y-2">
              {languages.map(({ code, label }) => (
                <li key={code}>
                  <Link
                    href={switchLocalePath(code)}
                    className={`text-sm transition-colors ${
                      locale === code
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-[#262626] mt-8 pt-4 flex justify-between text-xs text-gray-400">
          <span>{t('footerNav.bottom.rights', { year: '2026' })}</span>
          <span>{t('footerNav.bottom.city')}</span>
        </div>
      </div>
    </footer>
  );
}
