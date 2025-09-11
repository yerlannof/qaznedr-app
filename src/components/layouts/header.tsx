'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { favorites } = useFavorites();

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">
                QAZNEDR.KZ
              </span>
            </Link>
          </div>

          <div className="ml-10 hidden space-x-8 lg:block">
            <Link
              href="/listings"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Объявления
            </Link>
            <Link
              href="/about"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              О нас
            </Link>
            <Link
              href="/contact"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Контакты
            </Link>
          </div>

          <div className="ml-10 space-x-4 flex items-center">
            <Link
              href="/favorites"
              className="relative inline-flex items-center text-gray-500 hover:text-gray-900"
            >
              <Heart className="h-6 w-6" />
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link
              href="/create"
              className="inline-block bg-blue-600 px-4 py-2 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Разместить объявление
            </Link>

            <div className="lg:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              >
                <span className="text-gray-900">QAZNEDR.KZ</span>
              </Link>
              <Link
                href="/listings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Объявления
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                О нас
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Контакты
              </Link>
              <Link
                href="/favorites"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span>Избранное</span>
                  {favorites.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </div>
              </Link>
              <Link
                href="/create"
                className="block w-full bg-blue-600 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
              >
                Разместить объявление
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
