'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import Footer from '@/components/layouts/Footer';
import ServiceCard, { type ServiceItem } from '@/components/cards/ServiceCard';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

const SERVICE_TYPES = [
  { key: '', label: 'Все', emoji: '' },
  { key: 'drilling', label: 'Буровые работы', emoji: '\uD83D\uDD29' },
  { key: 'consulting', label: 'Консалтинг', emoji: '\uD83D\uDCA1' },
  { key: 'audit', label: 'Аудит', emoji: '\uD83D\uDCCB' },
  { key: 'legal', label: 'Юридические услуги', emoji: '\u2696\uFE0F' },
  { key: 'lab', label: 'Лабораторные анализы', emoji: '\uD83D\uDD2C' },
  { key: 'reserve_estimation', label: 'Оценка запасов', emoji: '\uD83D\uDCCA' },
  { key: 'equipment', label: 'Оборудование', emoji: '\u2699\uFE0F' },
  { key: 'other', label: 'Другое', emoji: '\uD83D\uDCE6' },
] as const;

const REGIONS = [
  'Все регионы',
  'Алматинская',
  'Акмолинская',
  'Актюбинская',
  'Атырауская',
  'Восточно-Казахстанская',
  'Жамбылская',
  'Западно-Казахстанская',
  'Карагандинская',
  'Костанайская',
  'Кызылординская',
  'Мангистауская',
  'Павлодарская',
  'Северо-Казахстанская',
  'Туркестанская',
];

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ServicesCatalogPage() {
  const { locale } = useTranslation();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (selectedType) params.set('service_type', selectedType);
      if (selectedRegion) params.set('region', selectedRegion);
      if (searchQuery.trim()) params.set('query', searchQuery.trim());

      const res = await fetch(`/api/services?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setServices(json.data.services);
        setPagination(json.data.pagination);
      } else {
        setServices([]);
        setPagination(null);
      }
    } catch {
      setServices([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, selectedType, selectedRegion, searchQuery]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRegion(value === 'Все регионы' ? '' : value);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavigationSimple />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Каталог услуг
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Профессиональные услуги для горнодобывающей отрасли Казахстана
            </p>
          </div>
          <Link
            href={`/${locale}/services`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Назад к услугам
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или провайдеру..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </form>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Service type chips */}
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((st) => (
              <button
                key={st.key}
                onClick={() => handleTypeChange(st.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === st.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {st.emoji ? `${st.emoji} ` : ''}
                {st.label}
              </button>
            ))}
          </div>

          {/* Region dropdown */}
          <div>
            <select
              value={selectedRegion || 'Все регионы'}
              onChange={handleRegionChange}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            Загрузка...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
              Услуг пока нет. Станьте первым поставщиком!
            </p>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Добавить услугу
            </Link>
          </div>
        ) : (
          <>
            {/* Count */}
            {pagination && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Найдено: {pagination.total}
              </p>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  locale={locale}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
