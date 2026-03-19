'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { REGIONS, MINERALS } from '@/lib/types/listing';
import AdvancedSearch from './AdvancedSearch';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  MapPin,
  Gem,
  DollarSign,
  Shield,
  TrendingUp,
  Droplets,
  Flame,
  Hexagon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Mock data for result counts (in real app, this would come from API)
const getResultCounts = () => ({
  types: {
    MINING_LICENSE: 45,
    EXPLORATION_LICENSE: 23,
    MINERAL_OCCURRENCE: 12,
  },
  regions: REGIONS.reduce(
    (acc, region) => {
      acc[region] = Math.floor(Math.random() * 20) + 1;
      return acc;
    },
    {} as Record<string, number>
  ),
  minerals: MINERALS.reduce(
    (acc, mineral) => {
      acc[mineral] = Math.floor(Math.random() * 15) + 1;
      return acc;
    },
    {} as Record<string, number>
  ),
});

function FiltersContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isSticky, setIsSticky] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    region: true,
    mineral: true,
    price: true,
    other: false,
  });
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [resultCounts] = useState(getResultCounts());
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Check for active filters
  useEffect(() => {
    let count = 0;
    if (searchParams.get('type')) count++;
    if (searchParams.get('region')) count++;
    if (searchParams.get('mineral')) count++;
    if (searchParams.get('priceMin') || searchParams.get('priceMax')) count++;
    if (searchParams.get('verified') === 'true') count++;
    setActiveFiltersCount(count);
  }, [searchParams]);

  // Handle sticky sidebar on desktop
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
  };

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceRange[0] > 0) {
      params.set('priceMin', priceRange[0].toString());
    } else {
      params.delete('priceMin');
    }
    if (priceRange[1] < 10000) {
      params.set('priceMax', priceRange[1].toString());
    } else {
      params.delete('priceMax');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setPriceRange([0, 10000]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  // Get current values from URL
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

  const FilterContent = () => (
    <>
      {/* Header with clear all */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('listings.filters')}
          </h2>
          {activeFiltersCount > 0 && (
            <Badge variant="blue" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-3.5 h-3.5 mr-1" />
            {t('listings.clearFilters')}
          </Button>
        )}
      </div>

      {/* Smart Search */}
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
          {t('listings.smartSearch')}
        </label>
        <AdvancedSearch />
      </div>

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Type Filter */}
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('type')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {t('listings.listingType')}
            </span>
            {expandedSections.type ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.type && (
            <div className="mt-3 space-y-1">
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value=""
                    checked={!currentFilters.type}
                    onChange={() => handleFilterChange('type', '')}
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('listings.allTypes')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {Object.values(resultCounts.types).reduce((a, b) => a + b, 0)}
                </span>
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="MINING_LICENSE"
                    checked={currentFilters.type === 'MINING_LICENSE'}
                    onChange={() =>
                      handleFilterChange('type', 'MINING_LICENSE')
                    }
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('listings.miningLicenses')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {resultCounts.types.MINING_LICENSE}
                </span>
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="EXPLORATION_LICENSE"
                    checked={currentFilters.type === 'EXPLORATION_LICENSE'}
                    onChange={() =>
                      handleFilterChange('type', 'EXPLORATION_LICENSE')
                    }
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('listings.explorationLicenses')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {resultCounts.types.EXPLORATION_LICENSE}
                </span>
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="MINERAL_OCCURRENCE"
                    checked={currentFilters.type === 'MINERAL_OCCURRENCE'}
                    onChange={() =>
                      handleFilterChange('type', 'MINERAL_OCCURRENCE')
                    }
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('listings.mineralOccurrences')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {resultCounts.types.MINERAL_OCCURRENCE}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              {t('listings.priceRange')}
            </span>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.price && (
            <div className="mt-4 px-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{priceRange[0]}</span>
                <span className="text-sm text-gray-500">
                  {priceRange[1] === 10000 ? '10000+' : priceRange[1]}
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000}
                step={100}
                className="mb-4"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                  placeholder="Мин"
                />
                <span className="self-center text-gray-400">—</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                  placeholder="Макс"
                />
              </div>
              <Button
                onClick={applyPriceRange}
                size="sm"
                className="w-full mt-3"
                variant="outline"
              >
                Применить
              </Button>
            </div>
          )}
        </div>

        {/* Region Filter */}
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('region')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              Регион
            </span>
            {expandedSections.region ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.region && (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="region"
                    value=""
                    checked={!currentFilters.region}
                    onChange={() => handleFilterChange('region', '')}
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Все регионы
                  </span>
                </div>
              </label>
              {REGIONS.map((region) => (
                <label
                  key={region}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="region"
                      value={region}
                      checked={currentFilters.region === region}
                      onChange={() => handleFilterChange('region', region)}
                      className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {region}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {resultCounts.regions[region]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Mineral Filter */}
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('mineral')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Gem className="w-3.5 h-3.5" />
              Полезное ископаемое
            </span>
            {expandedSections.mineral ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.mineral && (
            <div className="mt-3 space-y-1">
              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="mineral"
                    value=""
                    checked={!currentFilters.mineral}
                    onChange={() => handleFilterChange('mineral', '')}
                    className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Все минералы
                  </span>
                </div>
              </label>
              {MINERALS.map((mineral) => (
                <label
                  key={mineral}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="mineral"
                      value={mineral}
                      checked={currentFilters.mineral === mineral}
                      onChange={() => handleFilterChange('mineral', mineral)}
                      className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {mineral}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {resultCounts.minerals[mineral]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Additional Filters */}
        <div className="pb-4">
          <button
            onClick={() => toggleSection('other')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Дополнительные фильтры
            </span>
            {expandedSections.other ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.other && (
            <div className="mt-3 space-y-3">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={currentFilters.verified}
                  onChange={(e) =>
                    handleFilterChange('verified', e.target.checked)
                  }
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Только проверенные
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Sorting */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <label className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Сортировка
        </label>
        <select
          className="w-full mt-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
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

      {/* Quick Filter Tags */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
        <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
          Быстрые фильтры
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            {
              mineral: 'Нефть',
              icon: <Droplets size={14} />,
            },
            {
              mineral: 'Газ',
              icon: <Flame size={14} />,
            },
            {
              mineral: 'Золото',
              icon: <Gem size={14} />,
            },
            {
              mineral: 'Медь',
              icon: <Hexagon size={14} />,
            },
          ].map(({ mineral, icon }) => (
            <Button
              key={mineral}
              onClick={() =>
                handleFilterChange(
                  'mineral',
                  currentFilters.mineral === mineral ? '' : mineral
                )
              }
              variant={
                currentFilters.mineral === mineral ? 'default' : 'outline'
              }
              size="sm"
              className="text-xs"
              leftIcon={icon}
            >
              {mineral}
            </Button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Filters - Sticky Sidebar */}
      <div className="hidden lg:block">
        <div
          className={cn(
            'bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-gray-700 shadow-subtle p-5 transition-all',
            isSticky && 'sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto'
          )}
        >
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters - Bottom Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full mb-4" variant="outline">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Фильтры
              {activeFiltersCount > 0 && (
                <Badge variant="blue" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function FiltersFallback() {
  return (
    <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-gray-700 shadow-subtle p-5">
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-2" />
              <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
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
