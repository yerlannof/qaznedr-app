'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import GuideLinks from '@/components/features/GuideLinks';
import { useTranslation } from '@/hooks/useTranslation';
import { Mountain, Scale, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layouts/Footer';

export default function ServicesPage() {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const serviceCategories = [
    {
      id: 'geological',
      title: t('services.titles.geological'),
      description: t('services.descriptions.geological'),
      icon: Mountain,
      href: '/services/geological',
    },
    {
      id: 'legal',
      title: t('services.titles.legal'),
      description: t('services.descriptions.legal'),
      icon: Scale,
      href: '/services/legal',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {t('services.sections.categories')}
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {t('services.hero.title')}
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          {t('services.hero.subtitle')}
        </p>

        {/* Search */}
        <div className="mt-8 max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('services.hero.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-50 placeholder:text-gray-400 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] focus:outline-none transition-colors duration-150"
          />
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/${locale}${category.href}`}>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-[#141414] hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                    <Icon className="w-5 h-5 text-gray-400 mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.description}
                    </p>

                    <span className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#0A84FF] font-medium">
                      {t('services.labels.viewAll')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GuideLinks locale={locale} heading={t('insights.servicesHeading')} />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-[#141414]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            {t('services.cta.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg">
            {t('services.cta.description')}
          </p>
          <div className="flex gap-3 mt-6">
            <Button>{t('services.cta.postService')}</Button>
            <Button variant="outline">{t('services.cta.contactUs')}</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
