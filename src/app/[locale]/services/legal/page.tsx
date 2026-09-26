'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { Scale, Search, User, Building, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

const specializations = [
  'Горное право',
  'Лицензирование',
  'M&A сделки',
  'Экологическое право',
  'Недропользование',
  'Арбитраж',
  'Международное право',
  'Контрактное право',
  'Валютное регулирование',
  'Трудовое право',
  'Охрана труда',
  'Земельное право',
];

export default function LegalServicesPage() {
  const { locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gold-dark dark:text-gold-light">
          Юридические услуги
        </p>
        <h1 className="mt-3 font-serif font-light tracking-tight text-4xl lg:text-5xl text-gray-900 dark:text-gray-50">
          Юридические эксперты по горному праву
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          Юристы и консультанты, специализирующиеся на недропользовании
          Казахстана.
        </p>

        {/* Search */}
        <div className="max-w-2xl mt-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Найдите эксперта по имени, компании или специализации..."
            className="w-full px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#141414] text-lg focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
          />
          <Button size="icon" className="absolute right-2 top-2 rounded-lg">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Empty state */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#141414] p-10 lg:p-16 text-center">
          <Scale className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gold-dark dark:text-gold-light">
            Идёт набор экспертов
          </p>
          <h2 className="mt-3 font-serif font-light tracking-tight text-2xl lg:text-3xl text-gray-900 dark:text-gray-50">
            Скоро здесь появятся эксперты
          </h2>
          <p className="mt-4 text-sm lg:text-base text-gray-500 max-w-md mx-auto">
            Юристы по горному праву ещё не размещены в каталоге. Если вы
            практикуете в сфере недропользования — создайте профиль эксперта.
          </p>
          <div className="mt-8">
            <Link href={`/${locale}/contact`}>
              <Button>
                Стать экспертом
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Specializations */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Специализации
          </h3>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <span
                key={spec}
                className="px-3 py-1.5 rounded-full text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-[#141414] mt-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Юрист по горному праву?
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg">
            Присоединяйтесь к нашей базе экспертов и найдите новых клиентов в
            области недропользования Казахстана
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href={`/${locale}/contact`}>
              <Button>
                <User className="w-4 h-4 mr-2" />
                Создать профиль эксперта
              </Button>
            </Link>
            <Link href={`/${locale}/contact`}>
              <Button variant="outline">
                <Building className="w-4 h-4 mr-2" />
                Зарегистрировать компанию
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
