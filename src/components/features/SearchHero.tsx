'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGIONS, MINERALS } from '@/lib/types/listing';
import AdvancedSearch from './AdvancedSearch';

export default function SearchHero() {
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    query: '',
    region: '',
    mineral: '',
    priceMax: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Формируем URL с параметрами поиска
    const params = new URLSearchParams();

    if (searchData.query) params.set('q', searchData.query);
    if (searchData.region) params.set('region', searchData.region);
    if (searchData.mineral) params.set('mineral', searchData.mineral);
    if (searchData.priceMax) params.set('priceMax', searchData.priceMax);

    const url = `/listings?${params.toString()}`;
    router.push(url);
  };

  const popularSearches = [
    { query: 'Нефть Мангистауская', icon: '🛢️' },
    { query: 'Золото Восточно-Казахстанская', icon: '🥇' },
    { query: 'Газ Атырауская', icon: '⛽' },
    { query: 'Медь Карагандинская', icon: '🔶' },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Найдите идеальное месторождение
          </h2>
          <p className="text-gray-600">
            Используйте фильтры для поиска по региону, типу минерала и цене
          </p>
        </div>

        {/* Advanced Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Умный поиск месторождений
            </label>
            <AdvancedSearch />
          </div>

          {/* Quick Search Options */}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регион
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchData.region}
                  onChange={(e) =>
                    setSearchData({ ...searchData, region: e.target.value })
                  }
                >
                  <option value="">Все регионы</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mineral */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Минерал
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchData.mineral}
                  onChange={(e) =>
                    setSearchData({ ...searchData, mineral: e.target.value })
                  }
                >
                  <option value="">Все минералы</option>
                  {MINERALS.map((mineral) => (
                    <option key={mineral} value={mineral}>
                      {mineral}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🔍</span>
                  <span>Поиск</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Popular Searches */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Популярные запросы:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchData({ ...searchData, query: search.query });
                  // Автоматически запускаем поиск
                  const params = new URLSearchParams();
                  params.set('q', search.query);
                  router.push(`/listings?${params.toString()}`);
                }}
                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full hover:shadow-md hover:text-blue-600 transition-all border border-gray-200"
              >
                <span>{search.icon}</span>
                <span className="text-sm">{search.query}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
