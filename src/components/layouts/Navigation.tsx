'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { Menu, Search, User, LogOut, ChevronDown } from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const { data: session, status } = useSession();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { label: t('navigation.listings'), href: `/${locale}/listings` },
    { label: t('navigation.services'), href: `/${locale}/services` },
    { label: t('navigation.companies'), href: `/${locale}/companies` },
    { label: t('navigation.blog'), href: `/${locale}/blog` },
    { label: t('navigation.education'), href: `/${locale}/education` },
  ];

  const isActive = (href: string) => {
    // Match exact or starts-with for sub-pages
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-gray-100 dark:bg-[#0A0A0A]/85 dark:border-gray-800'
          : 'bg-white border-b border-transparent dark:bg-[#0A0A0A] dark:border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: h-16, Mobile: h-14 */}
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="font-bold tracking-tight text-gray-900 dark:text-gray-50 text-lg"
          >
            QAZNEDR
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
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

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : session ? (
              /* Logged in: user dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-medium">
                    {session.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#141414] rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-50">
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.dashboard')}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/my-listings`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('navigation.listings')}
                    </Link>
                    <Link
                      href={`/${locale}/favorites`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.favorites')}
                    </Link>
                    <hr className="my-1 border-gray-100 dark:border-gray-800" />
                    <button
                      onClick={() => signOut({ callbackUrl: `/${locale}` })}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in: login + register */
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-colors"
                >
                  {t('common.login')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side: hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <SheetTitle className="text-left text-base font-semibold text-gray-900 dark:text-gray-50">
                    {t('common.menu')}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100%-73px)]">
                  {/* Nav links */}
                  <div className="flex-1 overflow-y-auto py-4 px-4">
                    <div className="space-y-1">
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
                    </div>

                    {/* User section in sheet */}
                    {session && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
                        <SheetClose asChild>
                          <Link
                            href={`/${locale}/dashboard`}
                            className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t('common.dashboard')}
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href={`/${locale}/dashboard/my-listings`}
                            className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t('navigation.listings')}
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href={`/${locale}/favorites`}
                            className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t('common.favorites')}
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>

                  {/* Bottom actions */}
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                    {session ? (
                      <button
                        onClick={() => signOut({ callbackUrl: `/${locale}` })}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <SheetClose asChild>
                          <Link
                            href={`/${locale}/auth/login`}
                            className="block w-full px-4 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t('common.login')}
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href={`/${locale}/auth/register`}
                            className="block w-full px-4 py-2.5 text-sm text-center font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                          >
                            {t('common.register')}
                          </Link>
                        </SheetClose>
                      </div>
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
