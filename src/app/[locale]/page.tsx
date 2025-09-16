'use client';

import { useRouter, useParams } from 'next/navigation';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import Footer from '@/components/layouts/Footer';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Building2,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'ru';

  // Simple text content for Russian locale (to be replaced with proper i18n later)
  const texts = {
    home: {
      officialPlatform: 'Официальная платформа Казахстана',
      title: 'Цифровая платформа недропользования Казахстана',
      subtitle: 'Платформа для покупки и продажи лицензий на разработку месторождений в Казахстане',
      viewListings: 'Смотреть объявления',
      postListing: 'Подать объявление',
      miningLicenses: 'Лицензии на добычу',
      miningLicensesDesc: 'Готовые к добыче лицензии',
      explorationLicenses: 'Лицензии на разведку',
      explorationLicensesDesc: 'Лицензии для геологической разведки',
      mineralOccurrences: 'Месторождения',
      mineralOccurrencesDesc: 'Обнаруженные месторождения полезных ископаемых',
      getStarted: 'Начать работу',
      getStartedDesc: 'Присоединяйтесь к ведущей платформе горнодобывающей промышленности Казахстана',
      goToListings: 'К объявлениям',
      ourServices: 'Наши услуги',
      whyChooseUs: 'Почему выбирают нас',
      activeListings: 'Активных объявлений',
      kazakhstanRegions: 'Регионов Казахстана',
      verifiedCompanies: 'Проверенных компаний',
      customerSupport: 'Поддержка клиентов'
    }
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = texts;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <>
      <NavigationSimple />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              {/* Premium Title with Better Typography */}
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
                  <span className="mr-2">🏛️</span>
                  {t('home.officialPlatform')}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                  <span className="block text-blue-600 dark:text-blue-400 mb-2">
                    {t('home.title').split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className="block text-gray-900 dark:text-gray-100">
                    {t('home.title').split(' ').slice(2).join(' ')}
                  </span>
                </h1>
              </div>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('home.subtitle')}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/${locale}/listings`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('home.viewListings')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href={`/${locale}/listings/create`}
                  className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('home.postListing')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('home.miningLicenses')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.miningLicensesDesc')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('home.explorationLicenses')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.explorationLicensesDesc')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('home.mineralOccurrences')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.mineralOccurrencesDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('home.getStarted')}</h2>
            <p className="text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('home.getStartedDesc')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/listings`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('home.goToListings')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href={`/${locale}/services`}
                className="inline-flex items-center px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {t('home.ourServices')}
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('home.whyChooseUs')}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">
                {t('home.activeListings')}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">14</div>
              <div className="text-gray-600 dark:text-gray-400">
                {t('home.kazakhstanRegions')}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600 dark:text-gray-400">
                {t('home.verifiedCompanies')}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">
                {t('home.customerSupport')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
