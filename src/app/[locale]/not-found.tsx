'use client';

import Link from 'next/link';
import { Home, ArrowRight, Compass } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotFound() {
  const { t, locale } = useTranslation();
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center px-6 pt-20 lg:pt-24 pb-24">
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Decorative accent */}
          <div
            className="flex items-center justify-center mb-8"
            aria-hidden="true"
          >
            <span className="h-px w-10 bg-gold/40" />
            <Compass className="mx-3 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span className="h-px w-10 bg-gold/40" />
          </div>

          {/* Faint oversized 404 */}
          <p
            className="font-serif text-[7rem] sm:text-[9rem] leading-none font-light tracking-tight text-gray-900/[0.06] dark:text-white/[0.07] select-none"
            aria-hidden="true"
          >
            404
          </p>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-gray-900 dark:text-gray-50 -mt-6">
            {t('notFound.title')}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400 font-sans">
            {t('notFound.text')}
          </p>

          {/* Primary action */}
          <div className="mt-10">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-subtle transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 dark:bg-gray-50 dark:text-gray-900"
            >
              <Home className="h-4 w-4" strokeWidth={1.75} />
              {t('notFound.home')}
            </Link>
          </div>

          {/* Secondary gold links */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
            >
              {t('notFound.contact')}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </Link>
            <Link
              href={`/${locale}/leads`}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
            >
              {t('notFound.leads')}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
