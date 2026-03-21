'use client';

import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Video,
  FileText,
  Users,
  Award,
  ArrowRight,
  Clock,
  BarChart3,
} from 'lucide-react';

const COURSE_CATEGORIES = [
  {
    id: 'licensing',
    icon: FileText,
    title: 'Лицензирование и право',
    description:
      'Как получить, передать и сохранить лицензию на недропользование в Казахстане',
    courses: 3,
    level: 'Начальный',
  },
  {
    id: 'investing',
    icon: BarChart3,
    title: 'Инвестиции в недра',
    description:
      'Оценка проектов, due diligence, структурирование сделок в горнодобыче',
    courses: 2,
    level: 'Продвинутый',
  },
  {
    id: 'geology',
    icon: GraduationCap,
    title: 'Основы геологоразведки',
    description:
      'Методы разведки, оценка запасов, стандарты отчётности (JORC, KAZRC)',
    courses: 4,
    level: 'Средний',
  },
  {
    id: 'environment',
    icon: Award,
    title: 'Экология и рекультивация',
    description:
      'ОВОС, экологический мониторинг, требования законодательства РК',
    courses: 2,
    level: 'Средний',
  },
];

const UPCOMING_WEBINARS = [
  {
    title: 'Изменения в Кодексе о недрах РК 2026: что нужно знать',
    date: '15 апреля 2026',
    speaker: 'Алмас Ержанов, горный юрист',
    type: 'Вебинар',
  },
  {
    title: 'Оценка запасов по KAZRC: практический мастер-класс',
    date: '22 апреля 2026',
    speaker: 'Сакен Бейсембаев, геолог, компетентное лицо KAZRC',
    type: 'Мастер-класс',
  },
  {
    title: 'Due diligence горнодобывающих проектов для инвесторов',
    date: '6 мая 2026',
    speaker: 'Динара Кенжеева, инвестиционный аналитик',
    type: 'Вебинар',
  },
];

export default function EducationPage() {
  const { locale } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Образование
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Обучение для специалистов отрасли
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          Курсы, вебинары и мастер-классы по геологии, лицензированию и
          инвестициям в недропользование Казахстана.
        </p>
      </section>

      {/* Course Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-8">
          Направления обучения
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COURSE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-[#141414] hover:border-gray-300 hover:shadow-medium transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {cat.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>{cat.courses} курсов</span>
                      <span>Уровень: {cat.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="py-16 bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Ближайшие мероприятия
            </h2>
          </div>
          <div className="space-y-3">
            {UPCOMING_WEBINARS.map((webinar, i) => (
              <div
                key={i}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-[#141414] hover:border-gray-300 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <Video className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {webinar.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {webinar.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {webinar.speaker}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1 whitespace-nowrap">
                  {webinar.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-[#141414]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Хотите провести обучение для своей компании?
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg">
            Организуем корпоративные программы по геологии, лицензированию и
            инвестициям — адаптированные под ваши задачи.
          </p>
          <div className="flex gap-3 mt-6">
            <Button>Связаться</Button>
            <Button variant="outline">Подробнее</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
