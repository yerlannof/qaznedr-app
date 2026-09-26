import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/legal/terms', 'terms');
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sections = [
    {
      h: 'Общие положения',
      body: [
        'Сайт qaznedr.kz принадлежит ТОО «QAZNEDR HOLDING» (далее — «Компания»). Используя сайт, вы соглашаетесь с этими условиями.',
      ],
    },
    {
      h: 'Информация на сайте',
      body: [
        'Сведения об участках носят ознакомительный характер и не являются публичной офертой. Условия сделки определяются отдельным договором.',
      ],
    },
    {
      h: 'Статус участков',
      body: [
        'Свободность участка указана по проверке Компании на дату, указанную в карточке; статус может измениться. Компания не заявляет права на участки, по которым у неё нет лицензии.',
      ],
    },
    {
      h: 'Геологические данные',
      body: [
        'Оценки приводятся с указанием стандарта (категории ГКЗ СССР или историческая оценка). Прогнозные ресурсы не являются запасами. Компания не гарантирует доходность и результат работ.',
      ],
    },
    {
      h: 'Конфиденциальность',
      body: [
        'Материалы, переданные после подписания NDA, используются только для оценки сделки.',
        'Персональные данные из заявок обрабатываются только для ответа на обращение и не передаются третьим лицам, кроме случаев, предусмотренных законом.',
      ],
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <section
          lang="ru"
          className="brand-container max-w-[760px] pt-12 pb-16 lg:pt-16 lg:pb-24"
        >
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase text-brand-muted">
              Правовая информация
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-brand-ink leading-[1.05]">
            Условия использования
          </h1>
          <p className="mt-4 text-sm text-brand-muted">
            Последнее обновление: сентябрь 2026
          </p>

          <div className="mt-12 space-y-12">
            {sections.map(({ h, body }) => (
              <section key={h}>
                <h2 className="font-serif text-2xl lg:text-3xl text-brand-ink tracking-tight mb-4">
                  {h}
                </h2>
                <div className="space-y-4">
                  {body.map((p, i) => (
                    <p
                      key={i}
                      className="text-base text-brand-muted leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h2 className="font-serif text-2xl lg:text-3xl text-brand-ink tracking-tight mb-4">
                Контакты
              </h2>
              <p className="text-base text-brand-muted leading-relaxed">
                Вопросы по этим условиям задавайте через{' '}
                <Link
                  href={`/${locale}/contact`}
                  className="brand-focus text-brand-ink underline underline-offset-4 decoration-brand-line hover:text-brand-muted"
                >
                  страницу контактов
                </Link>
                .
              </p>
            </section>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
