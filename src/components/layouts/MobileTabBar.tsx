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
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active
                  ? 'text-[#0A84FF]'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
