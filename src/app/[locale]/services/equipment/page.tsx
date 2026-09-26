'use client';

import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

const EQUIPMENT_CATEGORIES = [
  'Буровое оборудование',
  'Экскаваторы',
  'Самосвалы',
  'Дробильно-сортировочные комплексы',
  'Бульдозеры',
  'Погрузчики',
  'Транспортная техника',
  'Лабораторное оборудование',
  'Генераторы и компрессоры',
  'Насосное оборудование',
];

export default function EquipmentRentalPage() {
  const { locale } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Header */}
      <div className="bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-dark dark:text-gold-light">
            Услуги
          </p>
          <h1 className="mt-3 font-serif font-light tracking-tight text-4xl lg:text-5xl text-gray-900 dark:text-gray-50">
            Аренда оборудования
          </h1>
          <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-2xl">
            Буровая, землеройная и лабораторная техника для проектов
            недропользования Казахстана.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#141414] p-10 lg:p-16 text-center">
          <Truck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gold-dark dark:text-gold-light">
            Идёт набор поставщиков
          </p>
          <h2 className="mt-3 font-serif font-light tracking-tight text-2xl lg:text-3xl text-gray-900 dark:text-gray-50">
            Скоро здесь появится техника
          </h2>
          <p className="mt-4 text-sm lg:text-base text-gray-500 max-w-md mx-auto">
            Оборудование для аренды ещё не размещено в каталоге. Если вы сдаёте
            технику — станьте одним из первых поставщиков.
          </p>
          <div className="mt-8">
            <Link href={`/${locale}/support`}>
              <Button>
                Стать поставщиком
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Equipment categories */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Категории техники
          </h3>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_CATEGORIES.map((category) => (
              <span
                key={category}
                className="px-3 py-1.5 rounded-full text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
