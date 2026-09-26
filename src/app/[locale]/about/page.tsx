import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { MapPin, FileText, ShieldCheck, ArrowRight } from 'lucide-react';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/about', 'about');
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const points = [
    {
      icon: MapPin,
      title: 'Находки на свободные участки',
      desc: 'Проверенные геологические находки на доступные и свободные минеральные объекты. Тизер открыт всем; полный пакет — после заявки и соглашения.',
    },
    {
      icon: FileText,
      title: 'Объявления о продаже',
      desc: 'Лицензии на добычу и разведку, а также задокументированные рудопроявления, выставленные на продажу владельцами прав.',
    },
    {
      icon: ShieldCheck,
      title: 'Сверка с реестром',
      desc: 'Координаты и статусы участков сверяются с государственным геологическим реестром недропользования.',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Изучаете тизер',
      desc: 'Открытая часть находки или объявления: регион, тип сырья, ориентир по ценности. Без точных координат.',
    },
    {
      n: '02',
      title: 'Запрашиваете доступ',
      desc: 'Оставляете заявку и принимаете соглашение. Мы открываем полный пакет: точные координаты, название и первоисточник.',
    },
    {
      n: '03',
      title: 'Подаёте заявку на недропользование',
      desc: 'С данными на руках вы самостоятельно подаёте собственную заявку на право недропользования. Мы продаём информацию и доступ, а не права.',
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 lg:pt-16 lg:pb-20 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
                О платформе
              </span>
            </div>
            <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
              Геологические данные Казахстана — по делу
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              QAZNEDR.KZ соединяет старателей, инвесторов и владельцев прав с
              проверенными данными о недрах. Мы собираем сведения из
              государственных архивов, сверяем их с реестром недропользования и
              открываем доступ тем, кто готов работать с участком.
            </p>
          </div>
        </section>

        {/* Что мы делаем */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50">
            Что мы делаем
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {points.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-7"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[rgba(200,162,75,0.10)] text-gold-dark dark:text-gold-light mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl text-gray-900 dark:text-gray-50 leading-tight mb-3">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Как это работает */}
        <section className="bg-gray-50 dark:bg-[#141414] border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50">
              Как это работает
            </h2>
            <p className="mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Прозрачный путь от тизера до собственной заявки на
              недропользование.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map(({ n, title, desc }) => (
                <div key={n}>
                  <div className="font-serif text-3xl text-gold-dark dark:text-gold-light mb-3">
                    {n}
                  </div>
                  <div className="h-px w-12 bg-gold/40 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50 mb-8">
            С чего начать
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href={`/${locale}/leads`}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6 transition-all hover:border-gold/50 hover:shadow-medium hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-50">
                  Находки
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Свободные участки с проверенными данными.
              </p>
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6 transition-all hover:border-gold/50 hover:shadow-medium hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-50">
                  Контакты
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                WeChat, WhatsApp или заявка на сайте.
              </p>
            </Link>
            <Link
              href={`/${locale}/faq`}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6 transition-all hover:border-gold/50 hover:shadow-medium hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-50">
                  Вопросы и ответы
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Законность, оплата, гарантии и состав пакета.
              </p>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
