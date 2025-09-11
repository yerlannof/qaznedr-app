'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { REGIONS, MINERALS } from '@/lib/types/listing';
import AdvancedSearch from './AdvancedSearch';

function FiltersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Создаем строку запроса с учетом существующих параметров
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string | boolean) => {
    const stringValue =
      typeof value === 'boolean' ? (value ? 'true' : '') : value;
    const queryString = createQueryString(
      key === 'query' ? 'q' : key,
      stringValue
    );
    router.push(`${pathname}?${queryString}`);
  };

  // Получаем текущие значения фильтров из URL
  const currentFilters = {
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    region: searchParams.get('region') || '',
    mineral: searchParams.get('mineral') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    verified: searchParams.get('verified') === 'true',
    sort: searchParams.get('sort') || 'newest',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Поиск и фильтры
      </h2>

      {/* Advanced Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Умный поиск
        </label>
        <AdvancedSearch />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Тип объявления */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип объявления
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Все типы</option>
            <option value="MINING_LICENSE">Лицензии на добычу</option>
            <option value="EXPLORATION_LICENSE">Лицензии на разведку</option>
            <option value="MINERAL_OCCURRENCE">
              Информация о рудопроявлении
            </option>
          </select>
        </div>

        {/* Регион */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Регион
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
          >
            <option value="">Все регионы</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Минерал */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Полезное ископаемое
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.mineral}
            onChange={(e) => handleFilterChange('mineral', e.target.value)}
          >
            <option value="">Все минералы</option>
            {MINERALS.map((mineral) => (
              <option key={mineral} value={mineral}>
                {mineral}
              </option>
            ))}
          </select>
        </div>

        {/* Минимальная цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мин. цена (млрд ₸)
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.priceMin}
            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
          />
        </div>

        {/* Максимальная цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Макс. цена (млрд ₸)
          </label>
          <input
            type="number"
            placeholder="10000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.priceMax}
            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
          />
        </div>
      </div>

      {/* Sorting and Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Сортировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сортировка
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentFilters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="price_desc">Сначала дорогие</option>
            <option value="price_asc">Сначала дешевые</option>
            <option value="area_desc">Большая площадь</option>
            <option value="area_asc">Малая площадь</option>
            <option value="views_desc">По популярности</option>
          </select>
        </div>

        {/* Проверенные */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2 pb-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={currentFilters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Только проверенные</span>
          </label>
        </div>

        {/* Сброс фильтров */}
        <div className="flex items-end justify-end">
          <button
            onClick={() => router.push(pathname)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Быстрые фильтры
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { mineral: 'Нефть', icon: '🛢️' },
            { mineral: 'Газ', icon: '⛽' },
            { mineral: 'Золото', icon: '🥇' },
            { mineral: 'Медь', icon: '🔶' },
            { mineral: 'Уголь', icon: '⚫' },
            { mineral: 'Уран', icon: '☢️' },
            { mineral: 'Железо', icon: '🔩' },
          ].map(({ mineral, icon }) => (
            <button
              key={mineral}
              onClick={() => handleFilterChange('mineral', mineral)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                currentFilters.mineral === mineral
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {icon} {mineral}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FiltersFallback() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-full w-20"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ListingsFilters() {
  return (
    <Suspense fallback={<FiltersFallback />}>
      <FiltersContent />
    </Suspense>
  );
}
