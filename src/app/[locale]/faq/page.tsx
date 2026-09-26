import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { ArrowRight } from 'lucide-react';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/faq', 'faq');
}

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Что делает QAZNEDR HOLDING?',
    a: 'Готовим сделки по свободным рудным участкам Казахстана: наши геологи изучают участок по фондовым отчётам, мы проверяем его статус, оформляем лицензию под сделку и сопровождаем инвестора. Архивные отчёты мы не продаём — мы продаём экспертизу и сопровождение.',
  },
  {
    q: 'Кому принадлежат участки на сайте?',
    a: 'Никому: это свободные площади, по нашей проверке на дату в карточке. Лицензии на них пока нет ни у кого, в том числе у нас. Лицензию оформляем под конкретную сделку.',
  },
  {
    q: 'Какие форматы сделки возможны?',
    a: 'Лицензия на инвестора с нашим сопровождением; лицензия на холдинг с последующей передачей; совместное предприятие или earn-in; только аналитика. Формат выбираем на встрече.',
  },
  {
    q: 'Откуда геологические данные?',
    a: 'Из советских и казахстанских фондовых геологических отчётов и публикаций; их изучают наши геологи. Запасы указываем только по категориям ГКЗ СССР (A, B, C1, C2) или как историческую оценку. Прогнозные ресурсы P1–P3 — прогноз, а не запасы.',
  },
  {
    q: 'Что я увижу после встречи?',
    a: 'После подписания NDA — название и координаты участка, оценку наших геологов, правовой статус и план оформления.',
  },
  {
    q: 'Какие ограничения есть у сделки?',
    a: 'Передача права недропользования и долей требует разрешения уполномоченного органа (ст. 44–45 Кодекса о недрах). Лицензию на разведку твёрдых полезных ископаемых нельзя передать в первый год её действия. Мы учитываем это при выборе формата.',
  },
  {
    q: 'Что вы гарантируете?',
    a: 'Качество нашей экспертизы и то, что статус участка проверен на указанную дату. Мы не гарантируем доходность, результат разведки и решения государственных органов.',
  },
  {
    q: 'Как связаться?',
    a: 'Напишите в WeChat или WhatsApp и укажите код участка, либо оставьте заявку на странице контактов. Отвечаем в течение рабочего дня.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: a,
    },
  })),
};

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-20 lg:pt-24">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
              Вопросы и ответы
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
            Коротко о главном
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Как устроена сделка, откуда данные и что мы гарантируем — коротко и
            без общих фраз.
          </p>
        </section>

        {/* Q&A */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="py-8 first:pt-0 last:pb-0">
                <h2 className="font-serif text-2xl text-gray-900 dark:text-gray-50 tracking-tight mb-3">
                  {q}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0A0A0A] text-white border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-left">
            <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">
              Готовы обсудить участок?
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl">
              Посмотрите витрину или напишите нам — ответим в течение рабочего
              дня.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/leads`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all"
              >
                Смотреть участки
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Связаться
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
