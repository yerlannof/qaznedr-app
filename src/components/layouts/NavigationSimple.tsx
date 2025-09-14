'use client';

import Link from 'next/link';

export default function NavigationSimple() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">QAZNEDR.KZ</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/listings"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Объявления
            </Link>
            <Link 
              href="/services"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Услуги
            </Link>
            <Link 
              href="/companies"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Компании
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Link
              href="/listings/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Создать объявление
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}