'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { Menu, LogOut, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

/**
 * Navigation — fixed top nav bar, h-16 (desktop) / h-14 (mobile).
 *
 * IMPORTANT: Every page that renders this component must add `pt-16`
 * (or `pt-14` on mobile if using the shorter bar) to its root content
 * wrapper so the fixed nav does not overlap page content.
 */
export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t('navigation.leads'), href: `/${locale}/leads` },
    { label: t('navigation.services'), href: `/${locale}/services` },
    { label: t('navigation.blog'), href: `/${locale}/blog` },
    { label: t('navigation.about'), href: `/${locale}/about` },
  ];
  const contactHref = `/${locale}/contact`;
  const adminHref = `/${locale}/admin`;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      aria-label={t('common.menu')}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 border-b border-gray-100 dark:bg-[#0A0A0A]/95 dark:border-gray-800'
          : 'bg-white border-b border-transparent dark:bg-[#0A0A0A] dark:border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link
            href={`/${locale}`}
            className="font-bold tracking-tight text-gray-900 dark:text-gray-50 text-lg"
          >
            QAZNEDR
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`px-3 py-2 text-sm transition-colors rounded-md ${
                  isActive(link.href)
                    ? 'text-gray-900 dark:text-gray-50 font-medium'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {session && (
              <>
                <Link
                  href={adminHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-colors"
                >
                  <Shield aria-hidden className="w-4 h-4" />
                  {t('navigation.admin')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  aria-label={t('common.logout')}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut aria-hidden className="w-4 h-4" />
                </button>
              </>
            )}
            <Link
              href={contactHref}
              className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              {t('navigation.contact')}
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={t('common.menu')}
                  aria-expanded={isOpen}
                  aria-controls="mobile-nav-menu"
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
                >
                  <Menu aria-hidden className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                id="mobile-nav-menu"
                side="right"
                className="w-[300px] sm:w-[360px] p-0"
              >
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <SheetTitle className="text-left text-base font-semibold text-gray-900 dark:text-gray-50">
                    {t('common.menu')}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100%-73px)]">
                  <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            isActive(link.href)
                              ? 'text-gray-900 dark:text-gray-50 font-medium bg-gray-50 dark:bg-gray-800'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    {session && (
                      <SheetClose asChild>
                        <Link
                          href={adminHref}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Shield aria-hidden className="w-4 h-4" />
                          {t('navigation.admin')}
                        </Link>
                      </SheetClose>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                    <div className="flex items-center justify-between px-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('common.theme') !== 'common.theme'
                          ? t('common.theme')
                          : 'Тема'}
                      </span>
                      <ThemeToggle />
                    </div>
                    <SheetClose asChild>
                      <Link
                        href={contactHref}
                        className="block w-full px-4 py-2.5 text-sm text-center font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      >
                        {t('navigation.contact')}
                      </Link>
                    </SheetClose>
                    {session && (
                      <button
                        onClick={() => signOut({ callbackUrl: `/${locale}` })}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <LogOut aria-hidden className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
