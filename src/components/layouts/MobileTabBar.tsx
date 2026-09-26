'use client';

import { Home, Gem, Briefcase, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { translate } from '@/lib/i18n/translations';

export default function MobileTabBar() {
  const pathname = usePathname();

  const locale = useMemo(() => {
    const segment = pathname.split('/')[1];
    return ['ru', 'kz', 'en', 'zh'].includes(segment) ? segment : 'ru';
  }, [pathname]);

  const tabs = [
    { key: 'home', icon: Home, href: `/${locale}` },
    { key: 'leads', icon: Gem, href: `/${locale}/leads` },
    { key: 'services', icon: Briefcase, href: `/${locale}/services` },
    { key: 'contact', icon: MessageCircle, href: `/${locale}/contact` },
  ];

  const isActive = (href: string) =>
    href === `/${locale}`
      ? pathname === href || pathname === `${href}/`
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label={translate(locale, 'common.menu')}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 dark:bg-[#0A0A0A] dark:border-[#262626]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A84FF] ${
                active
                  ? 'text-gray-900 dark:text-gray-50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon aria-hidden size={20} />
              <span className="text-[10px]">
                {translate(locale, `navigation.${tab.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
