import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Mail, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/support', 'support');
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
                Поддержка
              </span>
            </div>
            <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-gray-900 dark:text-gray-50 leading-[1.05]">
              Поможем разобраться
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Вопросы по доступу к находкам, составу пакета, объявлениям или
              оплате — напишите нам. Перед обращением загляните в раздел
              вопросов и ответов: там разобраны самые частые ситуации.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-7">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[rgba(200,162,75,0.10)] text-gold-dark dark:text-gold-light mb-5">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl text-gray-900 dark:text-gray-50 leading-tight mb-3">
                Электронная почта
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Опишите вопрос как можно конкретнее. Если речь о конкретной
                находке или объявлении — укажите её код.
              </p>
              <a
                href="mailto:info@qaznedr.kz"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-50 hover:text-gold-dark dark:hover:text-gold-light transition-colors"
              >
                info@qaznedr.kz
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-7">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[rgba(200,162,75,0.10)] text-gold-dark dark:text-gold-light mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl text-gray-900 dark:text-gray-50 leading-tight mb-3">
                Время ответа
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Отвечаем в течение одного рабочего дня. По заявкам на доступ к
                полному пакету — обычно быстрее.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ link */}
        <section className="bg-gray-50 dark:bg-[#141414] border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="flex flex-col items-start gap-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[rgba(200,162,75,0.10)] text-gold-dark dark:text-gold-light">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-50">
                Вопросы и ответы
              </h2>
              <p className="max-w-2xl text-gray-600 dark:text-gray-400">
                Законность, состав пакета за 1 000 000 ₸, источники данных,
                гарантии и порядок оплаты — собрали ответы на главные вопросы в
                одном месте.
              </p>
              <Link
                href={`/${locale}/faq`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all"
              >
                Открыть вопросы и ответы
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
