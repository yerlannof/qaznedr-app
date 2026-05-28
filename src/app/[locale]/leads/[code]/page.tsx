import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Badge } from '@/components/ui/badge';
import LeadLockedSection from '@/components/features/LeadLockedSection';
import {
  MapPin,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Lock,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import {
  TYPE_LABELS,
  EXCLUSIVITY_LABELS,
  isFreeStatus,
} from '@/lib/leads/types';

export const dynamic = 'force-dynamic';

export default async function LeadTeaserPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const lead = await getPublishedLeadByCode(code);
  if (!lead) notFound();

  const free = isFreeStatus(lead.license_status);
  const coordVerified =
    free &&
    (lead.license_status || '').toUpperCase().includes('COORD_VERIFIED');
  const isSold = lead.status === 'SOLD';
  const fairValue =
    lead.fair_value_min_usd_m || lead.fair_value_max_usd_m
      ? `$${lead.fair_value_min_usd_m ?? '?'}–${lead.fair_value_max_usd_m ?? '?'} млн`
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: lead.teaser_title || `Золотоносный участок ${lead.code}`,
    category: 'Geological lead',
    description:
      lead.teaser_summary ||
      'Свободный золотоносный участок (закрытая наводка).',
    areaServed: lead.region || 'Kazakhstan',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KZT',
      availability: isSold
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-gray-400 mb-6 flex items-center gap-1.5"
          >
            <Link href={`/${locale}/leads`} className="hover:text-gray-600">
              Наводки
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 dark:text-gray-300">
              {lead.code}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {isSold ? (
                    <Badge variant="default">ПРОДАНО</Badge>
                  ) : free ? (
                    <Badge variant="gold">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      СВОБОДЕН
                    </Badge>
                  ) : null}
                  <Badge variant="blue">{lead.mineral}</Badge>
                  <Badge variant="default">
                    {TYPE_LABELS[lead.type] ?? 'Объект'}
                  </Badge>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                  {lead.teaser_title ||
                    `Золото · ${lead.region || 'Казахстан'}`}
                </h1>
                {lead.region && (
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" /> {lead.region}
                    {lead.distance_band ? ` · ${lead.distance_band}` : ''}
                  </p>
                )}
              </div>

              {/* Value evidence */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📊 Чем подтверждена ценность
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lead.grade_display && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        Содержание Au
                      </dt>
                      <dd className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {lead.grade_display}
                      </dd>
                      {lead.grade_label && (
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {lead.grade_label}
                        </p>
                      )}
                    </div>
                  )}
                  {lead.reserve_categories &&
                    lead.reserve_categories.length > 0 && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-gray-400">
                          Категории запасов
                        </dt>
                        <dd className="text-sm font-medium">
                          {lead.reserve_categories.join(', ')}
                        </dd>
                      </div>
                    )}
                  {lead.byproducts_display && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        Попутные
                      </dt>
                      <dd className="text-sm font-medium">
                        {lead.byproducts_display}
                      </dd>
                    </div>
                  )}
                  {fairValue && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-gray-400">
                        Оценочная стоимость
                      </dt>
                      <dd className="text-sm font-medium inline-flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gold-dark" />{' '}
                        {fairValue}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="text-[12px] text-gray-400 mt-4">
                  ⚖️ Все цифры — из государственного первоисточника, с указанием
                  типа значения. Без приукрашивания.
                </p>
              </section>

              {/* Legal status */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  ✅ Юридический статус
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {free ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {free
                        ? coordVerified
                          ? 'Свободен — проверено по координатам на госкарте недропользования'
                          : 'Свободен по госреестру (рекомендуется координатная проверка перед заявкой)'
                        : 'Статус уточняется'}
                    </span>
                  </div>
                  {lead.last_verified && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" /> Дата проверки:{' '}
                      {lead.last_verified}
                    </div>
                  )}
                </div>
              </section>

              {/* Locked */}
              <LeadLockedSection />

              {/* Region indicator (exact GPS hidden) */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Расположение
                </h2>
                <div className="h-40 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-center">
                  <MapPin className="w-7 h-7 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {lead.region || 'Казахстан'}
                  </p>
                  <p className="text-[12px] text-gray-400">
                    Точные координаты скрыты до доступа
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-[rgba(200,162,75,0.06)] to-transparent p-5">
                  <div className="text-xs text-gray-500 mb-1">
                    Стоимость наводки
                  </div>
                  <div className="text-2xl font-bold text-gold-dark dark:text-gold-light">
                    {lead.price_display || 'По запросу'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {EXCLUSIVITY_LABELS[lead.exclusivity]}
                  </div>

                  {isSold ? (
                    <div className="mt-4 w-full text-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm font-medium">
                      Продано
                    </div>
                  ) : (
                    <Link
                      href={`/${locale}/leads/${lead.code}/full`}
                      className="mt-4 block w-full text-center px-4 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      Получить полные данные
                    </Link>
                  )}
                  <p className="text-[12px] text-gray-400 mt-3 text-center">
                    Логин → заявка → передача после соглашения
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-semibold mb-2">
                    Что входит в полный пакет
                  </h3>
                  <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Название и точная привязка</li>
                    <li>• Координаты (GPS)</li>
                    <li>• Цитаты госотчёта + первоисточник</li>
                    <li>• Методика выхода на точку</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
