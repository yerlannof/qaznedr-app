'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Mountain,
  Truck,
  Scale,
  Users,
  BookOpen,
  Newspaper,
  MapPin,
  Star,
  ArrowRight,
  Search,
  Filter,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layouts/Footer';

export default function ServicesPage() {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const serviceCategories = [
    {
      id: 'geological',
      title: t('services.titles.geological'),
      description: t('services.descriptions.geological'),
      icon: Mountain,
      color: 'blue',
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
      color: 'green',
      href: '/services/equipment',
      stats: { providers: 6, items: 78 },
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
      color: 'blue',
      href: '/services/legal',
      stats: { providers: 6, specialists: 23 },
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
      color: 'blue',
      href: '/services/investors',
      stats: { providers: 6, funded: 89 },
      featured: [
        { name: 'КазИнвест Майнинг', rating: 4.8, location: 'Алматы' },
        { name: 'Altyn Invest Fund', rating: 4.9, location: 'Нур-Султан' },
      ],
    },
  ];

  const knowledgeCenter = [
    {
      title: 'База знаний',
      description: 'Техническая документация, стандарты, регламенты',
      icon: BookOpen,
      href: '/knowledge',
      articles: 234,
    },
    {
      title: 'Новости отрасли',
      description:
        'Актуальные новости горнодобывающей промышленности Казахстана',
      icon: Newspaper,
      href: '/news',
      articles: 156,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavigationSimple />
      {/* Hero Section */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Экосистема горнодобывающих услуг
            </h1>
            <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-3xl mx-auto">
              Полный спектр профессиональных услуг для горнодобывающей отрасли
              Казахстана. От геологической разведки до инвестиционного
              сопровождения.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найдите нужную услугу или поставщика..."
                className="w-full px-6 py-4 rounded-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600"
              />
              <Button
                size="icon"
                className="absolute right-2 top-2 rounded-full"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Service Categories */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Категории услуг
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Выберите категорию услуг и найдите проверенных поставщиков в вашем
              регионе
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {serviceCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/${locale}${category.href}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                          category.color === 'blue'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'bg-green-100 dark:bg-green-900'
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 ${
                            category.color === 'blue'
                              ? 'text-blue-600'
                              : 'text-green-600'
                          }`}
                        />
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {category.description}
                      </p>

                      {/* Stats */}
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span>
                          {category.stats.providers ||
                            category.stats.specialists}{' '}
                          поставщиков
                        </span>
                        <span>
                          {category.stats.projects ||
                            category.stats.items ||
                            category.stats.funded}{' '}
                          проектов
                        </span>
                      </div>

                      {/* Featured providers */}
                      <div className="space-y-2 mb-4">
                        {category.featured.map((provider, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3" />
                              <span className="font-medium">
                                {provider.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{provider.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Смотреть все
                      </Button>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Knowledge Center & News */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Информационный центр
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Актуальная информация, новости отрасли и база знаний для
              профессионалов
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {knowledgeCenter.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href={`/${locale}${item.href}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.articles} материалов
                          </span>
                          <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Хотите разместить свои услуги?
          </h2>
          <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl mx-auto">
            Присоединяйтесь к нашей экосистеме и найдите новых клиентов в
            горнодобывающей отрасли Казахстана
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Разместить услуги
            </Button>
            <Button
              variant="outline"
              className="border-blue-400 dark:border-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              Связаться с нами
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
