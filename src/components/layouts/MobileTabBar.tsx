'use client';

import { Home, Search, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export default function MobileTabBar() {
  const pathname = usePathname();

  const locale = useMemo(() => {
    const segments = pathname.split('/');
    const localeFromPath = segments[1];
    return ['ru', 'kz', 'en', 'zh'].includes(localeFromPath)
      ? localeFromPath
      : 'ru';
  }, [pathname]);

  const tabs = [
    { label: 'Главная', icon: Home, href: `/${locale}` },
    { label: 'Каталог', icon: Search, href: `/${locale}/listings` },
    { label: 'Подать', icon: Plus, href: `/${locale}/listings/create` },
    { label: 'Профиль', icon: User, href: `/${locale}/dashboard` },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Мобильная навигация"
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
                  ? 'text-[#0A84FF]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon aria-hidden size={20} />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
