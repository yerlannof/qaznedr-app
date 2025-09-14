'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Search,
  MapPin,
  TrendingUp,
  Building2,
  Users,
  CheckCircle,
  Droplet,
  Flame,
  Coins,
  Cpu,
} from 'lucide-react';
import Recommendations from '@/components/features/Recommendations';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Force dynamic rendering to avoid SSR issues with animations
export const dynamic = 'force-dynamic';

export default function Home() {
  // Animated counters for social proof
  const [counts, setCounts] = useState({ listings: 0, companies: 0, deals: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const targets = { listings: 2345, companies: 128, deals: 89 };
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounts({
        listings: Math.floor(targets.listings * progress),
        companies: Math.floor(targets.companies * progress),
        deals: Math.floor(targets.deals * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section - Simplified and Impactful */}
      <section className="pt-24 pb-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="text-center">
            {/* Trust Badge */}
            {mounted ? (
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Официальная платформа • Защищенные сделки</span>
              </motion.div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Официальная платформа • Защищенные сделки</span>
              </div>
            )}

            {/* Headline - Short and Clear */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Цифровая платформа
              <br />
              <span className="text-blue-600">недропользования Казахстана</span>
            </h1>

            {/* 3 Key Value Props */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Проверенные продавцы</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Юридическая поддержка</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Прямые контакты</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Search className="w-5 h-5 mr-2" />
                Найти месторождение
              </Link>
              <Link
                href="/listings/create"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all transform hover:scale-105"
              >
                Разместить лицензию
              </Link>
            </div>
          </div>

          {/* Social Proof Counters */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {counts.listings.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Активных объявлений
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {counts.companies.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Компаний</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {counts.deals.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Успешных сделок</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - More Visual */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Как это работает
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group hover:shadow-xl transition-all duration-300 p-6 bg-white rounded-xl border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Интерактивная карта
              </h3>
              <p className="text-gray-600 text-sm">
                Все месторождения на карте с фильтрами по типу и региону
              </p>
            </div>

            <div className="group hover:shadow-xl transition-all duration-300 p-6 bg-white rounded-xl border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Аналитика рынка
              </h3>
              <p className="text-gray-600 text-sm">
                Актуальные данные и тренды по месторождениям Казахстана
              </p>
            </div>

            <div className="group hover:shadow-xl transition-all duration-300 p-6 bg-white rounded-xl border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Прямые сделки
              </h3>
              <p className="text-gray-600 text-sm">
                Безопасные сделки с юридической поддержкой на всех этапах
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Recommendations
            userPreferences={{
              preferredMinerals: ['Gold', 'Oil', 'Copper'],
              preferredRegions: ['Мангистауская', 'Атырауская'],
              priceRange: { min: 1000000000, max: 10000000000 },
              viewHistory: ['deposit-1', 'deposit-2'],
            }}
          />
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Популярные категории
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/listings?mineral=Нефть"
              className="group p-5 bg-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Droplet className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900">Нефть</div>
              <div className="text-sm text-gray-500 mt-1">234 объявления</div>
            </Link>

            <Link
              href="/listings?mineral=Газ"
              className="group p-5 bg-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Flame className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900">Газ</div>
              <div className="text-sm text-gray-500 mt-1">156 объявлений</div>
            </Link>

            <Link
              href="/listings?mineral=Золото"
              className="group p-5 bg-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Coins className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900">Золото</div>
              <div className="text-sm text-gray-500 mt-1">89 объявлений</div>
            </Link>

            <Link
              href="/listings?mineral=Медь"
              className="group p-5 bg-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Cpu className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
              </div>
              <div className="font-semibold text-gray-900">Медь</div>
              <div className="text-sm text-gray-500 mt-1">67 объявлений</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
