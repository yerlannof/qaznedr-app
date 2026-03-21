'use client';

import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  FileText,
  BookOpen,
  TrendingUp,
  MapPin,
  Scale,
  ArrowRight,
  Clock,
} from 'lucide-react';

// Категории блога
const BLOG_CATEGORIES = [
  { id: 'all', label: { ru: 'Все', en: 'All' } },
  { id: 'guides', label: { ru: 'Гайды', en: 'Guides' } },
  { id: 'investors', label: { ru: 'Для инвесторов', en: 'For Investors' } },
  { id: 'licensing', label: { ru: 'Лицензирование', en: 'Licensing' } },
  { id: 'regions', label: { ru: 'Регионы', en: 'Regions' } },
  { id: 'news', label: { ru: 'Новости', en: 'News' } },
];

// Примеры статей (потом заменятся данными из БД)
const SAMPLE_ARTICLES = [
  {
    id: '1',
    category: 'investors',
    icon: TrendingUp,
    title: {
      ru: 'Памятка инвестору: как оценить горнодобывающий проект в Казахстане',
      en: 'Investor memo: how to evaluate a mining project in Kazakhstan',
    },
    excerpt: {
      ru: 'Основные критерии оценки, на что обратить внимание при due diligence, типичные риски и красные флаги.',
      en: 'Key evaluation criteria, due diligence focus areas, typical risks and red flags.',
    },
    readTime: 12,
    date: '2026-03-15',
  },
  {
    id: '2',
    category: 'licensing',
    icon: FileText,
    title: {
      ru: 'Как получить лицензию на недропользование в Казахстане: пошаговое руководство',
      en: 'How to get a subsoil use license in Kazakhstan: step-by-step guide',
    },
    excerpt: {
      ru: 'Полный процесс от подачи заявки до получения лицензии. Необходимые документы, сроки, стоимость.',
      en: 'Complete process from application to license. Required documents, timelines, costs.',
    },
    readTime: 15,
    date: '2026-03-10',
  },
  {
    id: '3',
    category: 'regions',
    icon: MapPin,
    title: {
      ru: 'Обзор Мангистауской области: нефть, газ и перспективы',
      en: 'Mangystau region overview: oil, gas and prospects',
    },
    excerpt: {
      ru: 'Геологическая характеристика региона, основные месторождения, инфраструктура и инвестиционный потенциал.',
      en: 'Geological characteristics, key deposits, infrastructure and investment potential.',
    },
    readTime: 10,
    date: '2026-03-05',
  },
  {
    id: '4',
    category: 'guides',
    icon: BookOpen,
    title: {
      ru: 'JORC vs KAZRC: какой стандарт отчётности выбрать',
      en: 'JORC vs KAZRC: which reporting standard to choose',
    },
    excerpt: {
      ru: 'Сравнение международного и казахстанского кодексов отчётности о запасах. Когда какой использовать.',
      en: 'Comparison of international and Kazakh resource reporting codes. When to use which.',
    },
    readTime: 8,
    date: '2026-02-28',
  },
  {
    id: '5',
    category: 'licensing',
    icon: Scale,
    title: {
      ru: 'Передача лицензии на недропользование: юридические аспекты',
      en: 'Subsoil use license transfer: legal aspects',
    },
    excerpt: {
      ru: 'Как правильно оформить передачу лицензии, какие согласования нужны, типичные ошибки.',
      en: 'How to properly process a license transfer, required approvals, common mistakes.',
    },
    readTime: 11,
    date: '2026-02-20',
  },
  {
    id: '6',
    category: 'investors',
    icon: TrendingUp,
    title: {
      ru: 'Рынок золотодобычи Казахстана: текущее состояние и прогнозы',
      en: "Kazakhstan's gold mining market: current state and forecasts",
    },
    excerpt: {
      ru: 'Анализ основных месторождений, объёмы добычи, ключевые игроки и инвестиционные возможности.',
      en: 'Analysis of key deposits, production volumes, key players and investment opportunities.',
    },
    readTime: 14,
    date: '2026-02-15',
  },
];

export default function BlogPage() {
  const { locale } = useTranslation();
  const lang = locale === 'ru' || locale === 'kz' ? 'ru' : 'en';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Блог
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Статьи и аналитика
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          Гайды, памятки для инвесторов, обзоры регионов и новости геологической
          отрасли Казахстана.
        </p>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                cat.id === 'all'
                  ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-50'
              }`}
            >
              {cat.label[lang === 'ru' ? 'ru' : 'en']}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_ARTICLES.map((article) => {
            const Icon = article.icon;
            return (
              <Link
                key={article.id}
                href={`/${locale}/blog/${article.id}`}
                className="group"
              >
                <article className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">
                  {/* Image placeholder */}
                  <div className="h-40 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {
                          BLOG_CATEGORIES.find((c) => c.id === article.category)
                            ?.label[lang === 'ru' ? 'ru' : 'en']
                        }
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">
                        ·
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {article.readTime} мин
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 line-clamp-2 group-hover:text-[#0A84FF] transition-colors">
                      {article.title[lang]}
                    </h2>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">
                      {article.excerpt[lang]}
                    </p>

                    <div className="flex items-center gap-1 mt-4 text-sm text-[#0A84FF] font-medium">
                      Читать
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
