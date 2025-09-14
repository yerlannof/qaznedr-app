'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Building2, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-white to-gray-50 pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                QAZNEDR.KZ
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Платформа для покупки и продажи горнодобывающих активов в Казахстане
              </p>
              <div className="flex gap-4 justify-center">
                <Link 
                  href="/listings"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Смотреть объявления
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  href="/listings/create"
                  className="inline-flex items-center px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Разместить объявление
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Лицензии на добычу
              </h3>
              <p className="text-gray-600">
                Действующие лицензии на разработку месторождений полезных ископаемых
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Лицензии на разведку
              </h3>
              <p className="text-gray-600">
                Разрешения на геологическое изучение и поиск полезных ископаемых
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Проявления минералов
              </h3>
              <p className="text-gray-600">
                Документированные находки полезных ископаемых с потенциалом разработки
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Начните работу с QAZNEDR.KZ
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Найдите выгодные предложения по горнодобывающим активам или разместите собственное объявление
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/listings"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Перейти к объявлениям
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/services"
                className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Наши услуги
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Почему выбирают нас
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Активных объявлений</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">14</div>
              <div className="text-gray-600">Регионов Казахстана</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600">Проверенных компаний</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Поддержка клиентов</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}