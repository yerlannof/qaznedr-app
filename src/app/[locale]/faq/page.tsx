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
    q: 'Это законно?',
    a: 'Да. Мы продаём информацию и доступ к ней, а не права недропользования. Координаты и статусы участков сверяются с государственным геологическим реестром. Заявку на право разведки или добычи вы подаёте самостоятельно в уполномоченные государственные органы — как это и предусмотрено законодательством Казахстана.',
  },
  {
    q: 'Что входит в полный пакет за 1 000 000 ₸?',
    a: 'В тизере открыты только регион, тип сырья и ориентир по ценности. В полный пакет входят точные координаты участка, его наименование и первоисточник данных из государственных архивов — всё, что нужно, чтобы оценить объект и подать собственную заявку. Стоимость пакета — от 1 000 000 ₸ и указывается для каждого объекта отдельно.',
  },
  {
    q: 'Откуда берутся данные?',
    a: 'Сведения собираются из государственных геологических архивов и реестра недропользования Казахстана. Перед публикацией координаты и статусы участков сверяются с государственным реестром, поэтому вы работаете с откалиброванными, а не случайными данными.',
  },
  {
    q: 'Что я получаю после открытия доступа?',
    a: 'После заявки, принятия соглашения и оплаты мы открываем полный пакет по выбранной находке: точные координаты, наименование объекта и ссылку на первоисточник. С этими данными вы можете самостоятельно проверить участок и подать заявку на недропользование.',
  },
  {
    q: 'Какие гарантии?',
    a: 'Мы гарантируем, что данные на момент публикации сверены с государственным реестром и соответствуют первоисточнику. Мы не гарантируем результат добычи, инвестиций или одобрение вашей заявки государственными органами — эти решения и риски остаются на стороне пользователя.',
  },
  {
    q: 'Как происходит оплата?',
    a: 'Вы выбираете находку, оставляете заявку и принимаете условия доступа. После подтверждения оплаты полный пакет данных открывается в вашем кабинете. Стоимость зависит от объекта и начинается от 1 000 000 ₸.',
  },
  {
    q: 'Чем находки отличаются от объявлений?',
    a: 'Находки — это проверенные геологические сведения о свободных и доступных участках, по которым вы подаёте собственную заявку на недропользование. Объявления — это лицензии на добычу или разведку и задокументированные рудопроявления, которые продают их текущие владельцы. Находки про доступ к информации, объявления — про сделку с уже оформленными правами.',
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
            Законность, состав пакета, источники данных и гарантии — без общих
            фраз.
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
              Готовы посмотреть находки?
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl">
              Откройте каталог свободных участков. Тизер доступен без заявки.
            </p>
            <Link
              href={`/${locale}/leads`}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all"
            >
              Перейти к находкам
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
