'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  MapPin,
  Building2,
  Gavel,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
} from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Объявления', href: '/listings', icon: MapPin },
    { name: 'Карта', href: '/map', icon: MapPin },
    { name: 'Услуги', href: '/services', icon: Briefcase },
    { name: 'Аукционы', href: '/auctions', icon: Gavel },
    { name: 'Компании', href: '/companies', icon: Building2 },
    { name: 'Сообщения', href: '/messages', icon: MessageSquare },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
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

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-50"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      block px-3 py-2 rounded-lg text-base font-medium
                      ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              <hr className="my-2" />

              <Link
                href="/listings/create"
                className="block px-3 py-2 bg-blue-600 text-white rounded-lg text-center font-medium"
                onClick={() => setIsOpen(false)}
              >
                Создать объявление
              </Link>

              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Личный кабинет
              </Link>

              <Link
                href="/favorites"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Избранное
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
