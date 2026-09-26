'use client';

import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { Mountain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

const GEOLOGICAL_SERVICES = [
  'Геологическая разведка',
  'Геофизические исследования',
  'Геохимический анализ',
  'Бурение разведочных скважин',
  'Картографирование',
  'Сейсмическое зондирование',
  'Петрографический анализ',
  'Подсчет запасов',
  'Экологическое картирование',
  'Гидрогеологические изыскания',
];

export default function GeologicalServicesPage() {
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
            Геологические услуги
          </h1>
          <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-2xl">
            Геологоразведка, геофизика, подсчёт запасов и сопутствующие услуги в
            области недропользования Казахстана.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#141414] p-10 lg:p-16 text-center">
          <Mountain className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gold-dark dark:text-gold-light">
            Идёт набор поставщиков
          </p>
          <h2 className="mt-3 font-serif font-light tracking-tight text-2xl lg:text-3xl text-gray-900 dark:text-gray-50">
            Скоро здесь появятся поставщики
          </h2>
          <p className="mt-4 text-sm lg:text-base text-gray-500 max-w-md mx-auto">
            Геологические компании ещё не размещены в каталоге. Если вы
            оказываете геологические услуги — станьте одним из первых.
          </p>
          <div className="mt-8">
            <Link href={`/${locale}/contact`}>
              <Button>
                Стать поставщиком
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Service directions */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Направления услуг
          </h3>
          <div className="flex flex-wrap gap-2">
            {GEOLOGICAL_SERVICES.map((service) => (
              <span
                key={service}
                className="px-3 py-1.5 rounded-full text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
