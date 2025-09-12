import Link from 'next/link';
import { ArrowRight, Search, MapPin, TrendingUp } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Цифровая платформа
            <br />
            <span className="text-blue-600">недропользования Казахстана</span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Покупайте и продавайте месторождения полезных ископаемых онлайн.
            Прозрачно, безопасно, эффективно.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              Найти месторождение
            </Link>
            <Link
              href="/listings/create"
              className="inline-flex items-center px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Разместить объявление
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Возможности платформы
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Интерактивная карта
              </h3>
              <p className="text-gray-600">
                Просматривайте месторождения на карте Казахстана
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Аукционы
              </h3>
              <p className="text-gray-600">
                Участвуйте в торгах за права на разработку
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Прямые сделки
              </h3>
              <p className="text-gray-600">
                Заключайте сделки напрямую с владельцами
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Начните прямо сейчас
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/listings?mineral=Нефть"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">🛢️</div>
              <div className="font-medium">Нефтяные месторождения</div>
            </Link>

            <Link
              href="/listings?mineral=Газ"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">🔥</div>
              <div className="font-medium">Газовые месторождения</div>
            </Link>

            <Link
              href="/listings?mineral=Золото"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">🥇</div>
              <div className="font-medium">Золотые месторождения</div>
            </Link>

            <Link
              href="/auctions"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-medium">Активные аукционы</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
