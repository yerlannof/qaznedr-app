'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/auth/login`}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          {t('common.login') || 'Log in'}
        </Link>
        <Link
          href={`/${locale}/auth/register`}
          className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {t('common.register') || 'Register'}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
          {session.user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
          {session.user?.name}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('common.dashboard') || 'Dashboard'}
          </Link>
          <Link
            href={`/${locale}/dashboard/profile`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('common.profile') || 'Profile'}
          </Link>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('common.logout') || 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
