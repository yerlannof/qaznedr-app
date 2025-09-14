'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  MapPin,
  Building2,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
  Plus,
} from 'lucide-react';
import { GlobalSearch } from '@/components/features/GlobalSearch';
import ThemeToggleNew from '@/components/ui/ThemeToggleNew';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navigation() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll progress and sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      const winScroll =
        document.documentElement.scrollTop || document.body.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
      setIsScrolled(winScroll > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Объявления', href: '/listings', icon: MapPin },
    { name: 'Карта', href: '/map', icon: MapPin },
    { name: 'Услуги', href: '/services', icon: Briefcase },
    { name: 'Компании', href: '/companies', icon: Building2 },
    { name: 'Сообщения', href: '/messages', icon: MessageSquare },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav
        className={`fixed top-0 w-full bg-white z-50 border-b border-gray-200 transition-all duration-300 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Q</span>
                </div>
                <span className="font-bold text-xl text-gray-900">QAZNEDR</span>
              </Link>
            </div>

            {/* Desktop Navigation with Search */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Global Search */}
              <GlobalSearch />

              {/* Navigation Links */}
              <div className="flex items-center space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggleNew />
              <Link
                href="/listings/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Создать объявление
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Личный кабинет
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Избранное
                    </Link>
                    <hr className="my-1" />
                    <Link
                      href="/auth/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu with Sheet */}
            <div className="flex md:hidden items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Menu className="w-6 h-6 text-gray-600" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[320px] sm:w-[400px] p-0"
                >
                  <SheetHeader className="border-b px-6 py-4">
                    <SheetTitle className="text-left">Меню</SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-full">
                    {/* Mobile Search */}
                    <div className="px-6 py-4 border-b">
                      <GlobalSearch />
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto py-4">
                      <div className="px-3 space-y-1">
                        {navigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${
                                  isActive(item.href)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }
                              `}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="mt-4 px-3 pt-4 border-t space-y-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-5 h-5" />
                          <span>Личный кабинет</span>
                        </Link>

                        <Link
                          href="/favorites"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span>Избранное</span>
                        </Link>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t p-4 space-y-3">
                      <Link
                        href="/listings/create"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Создать объявление</span>
                      </Link>

                      <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
