'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Mountain,
  Truck,
  Scale,
  Users,
  BookOpen,
  Newspaper,
  ArrowRight,
  Search,
  Building2,
  Star,
} from 'lucide-react';
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
      stats: { providers: 47, projects: 156 },
      featured: [
        { name: 'КазГеоСервис', rating: 4.8, location: 'Алматы' },
        { name: 'Геопроспект КЗ', rating: 4.9, location: 'Нур-Султан' },
      ],
    },
    {
      id: 'equipment',
      title: t('services.titles.equipment'),
      description: t('services.descriptions.equipment'),
      icon: Truck,
      href: '/services/equipment',
      stats: { providers: 6, projects: 78 },
      featured: [
        { name: 'ТехРент Казахстан', rating: 4.7, location: 'Караганда' },
        { name: 'Горная Техника Ко', rating: 4.8, location: 'Алматы' },
      ],
    },
    {
      id: 'legal',
      title: t('services.titles.legal'),
      description: t('services.descriptions.legal'),
      icon: Scale,
      href: '/services/legal',
      stats: { providers: 6, projects: 23 },
      featured: [
        { name: 'Юр-Центр Недра', rating: 4.9, location: 'Алматы' },
        { name: 'Горное Право КЗ', rating: 4.8, location: 'Нур-Султан' },
      ],
    },
    {
      id: 'investors',
      title: t('services.titles.investors'),
      description: t('services.descriptions.investors'),
      icon: Users,
      href: '/services/investors',
      stats: { providers: 6, projects: 89 },
      featured: [
        { name: 'КазИнвест Майнинг', rating: 4.8, location: 'Алматы' },
        { name: 'Altyn Invest Fund', rating: 4.9, location: 'Нур-Султан' },
      ],
    },
  ];

  const knowledgeCenter = [
    {
      title: t('services.knowledge.knowledgeBase'),
      description: t('services.knowledge.knowledgeBaseDesc'),
      icon: BookOpen,
      href: '/knowledge',
      articles: 234,
    },
    {
      title: t('services.knowledge.industryNews'),
      description: t('services.knowledge.industryNewsDesc'),
      icon: Newspaper,
      href: '/news',
      articles: 156,
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Какие геологические услуги доступны в Казахстане?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'На платформе QAZNEDR доступны геологоразведка, юридическое сопровождение лицензий, аренда бурового оборудования и инвестиционные услуги для недропользователей.',
        },
      },
      {
        '@type': 'Question',
        name: 'Как найти поставщика геологических услуг?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Используйте каталог услуг QAZNEDR для поиска проверенных поставщиков по категориям: геология, оборудование, юридические услуги, инвестиции.',
        },
      },
      {
        '@type': 'Question',
        name: 'Как разместить объявление о продаже лицензии?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Зарегистрируйтесь на платформе, выберите тип объявления (лицензия на добычу, разведку или рудопроявление) и заполните данные о месторождении.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
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

      {/* Catalog CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Link href={`/${locale}/services/catalog`}>
          <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-[#141414] hover:border-gray-300 hover:shadow-medium transition-all duration-200 group">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Каталог услуг
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Буровые работы, консалтинг, аудит, юридические услуги и многое
                другое
              </p>
            </div>
            <span className="text-sm text-[#0A84FF] font-medium flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap ml-4">
              Перейти
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

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
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      {category.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 text-xs text-gray-400 mb-4">
                      <span>
                        {category.stats.providers}{' '}
                        {t('services.labels.providers')}
                      </span>
                      <span>
                        {category.stats.projects}{' '}
                        {t('services.labels.projects')}
                      </span>
                    </div>

                    {/* Featured */}
                    <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {category.featured.map((provider, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span>{provider.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-gray-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{provider.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Knowledge Center */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-8">
          {t('services.sections.informationCenter')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {knowledgeCenter.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} href={`/${locale}${item.href}`}>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-[#141414] hover:border-gray-300 hover:shadow-medium transition-all duration-200 group">
                  <div className="flex items-start gap-4">
                    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">
                          {item.articles} {t('services.labels.materials')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0A84FF] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
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
