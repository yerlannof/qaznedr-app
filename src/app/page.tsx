import Link from 'next/link';
import { Suspense } from 'react';
import Navigation from '@/components/layouts/Navigation';
import SearchHero from '@/components/features/SearchHero';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            Цифровая платформа
            <br />
            <span className="text-blue-600">недропользования</span>
            <br />
            Казахстана
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Покупайте и продавайте месторождения полезных ископаемых онлайн.
            Прозрачно, безопасно, эффективно.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Link
              href="/listings"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
            >
              Найти месторождение
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:shadow-md transition-shadow"
            >
              Разместить объявление
            </Link>
          </div>
        </div>
      </section>

      {/* Search Hero */}
      <Suspense fallback={
        <div className="py-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      }>
        <SearchHero />
      </Suspense>

      {/* Statistics Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">156</div>
              <div className="text-gray-600">Активных объявлений</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">89</div>
              <div className="text-gray-600">Проверенных объектов</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">17</div>
              <div className="text-gray-600">Регионов охвата</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">45+</div>
              <div className="text-gray-600">Успешных сделок</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Преимущества платформы
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl hover:shadow-md transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏔️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Проверенные месторождения
              </h3>
              <p className="text-gray-600">
                Все объекты проходят проверку документов и геологических данных.
                Только лицензированные месторождения.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl hover:shadow-md transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-blue-600 text-xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Безопасные сделки
              </h3>
              <p className="text-gray-600">
                Юридическое сопровождение, проверка документов и гарантии
                безопасности каждой сделки.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl hover:shadow-md transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Полная аналитика
              </h3>
              <p className="text-gray-600">
                Детальная информация о запасах, геологии, инфраструктуре и
                экономических показателях.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Готовы начать работу?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Присоединяйтесь к ведущей платформе недропользования Казахстана
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
          >
            Начать работу
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Платформа</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/listings"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Месторождения
                  </Link>
                </li>
                <li>
                  <Link
                    href="/regions"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    По регионам
                  </Link>
                </li>
                <li>
                  <Link
                    href="/minerals"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    По минералам
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Компания</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    О нас
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Карьера
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Ресурсы</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/docs"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Документация
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Помощь
                  </Link>
                </li>
                <li>
                  <Link
                    href="/news"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Новости
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Правовая информация
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Конфиденциальность
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Условия использования
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>&copy; 2024 QAZNEDR.KZ. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
