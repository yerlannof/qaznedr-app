'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
} from 'lucide-react';
import { searchService, SearchFilters } from '@/lib/search/search-service';
import { Button } from '@/components/ui/button-new';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const MINERAL_OPTIONS = [
  'Нефть',
  'Газ',
  'Золото',
  'Медь',
  'Уголь',
  'Уран',
  'Железо',
];

const REGION_OPTIONS = [
  'Мангистауская',
  'Атырауская',
  'Западно-Казахстанская',
  'Актюбинская',
  'Костанайская',
  'Северо-Казахстанская',
  'Акмолинская',
  'Павлодарская',
  'Карагандинская',
  'Восточно-Казахстанская',
  'Алматинская',
  'Жамбылская',
  'Туркестанская',
  'Кызылординская',
];

const TYPE_OPTIONS = [
  { value: 'MINING_LICENSE', label: 'Лицензия на добычу' },
  { value: 'EXPLORATION_LICENSE', label: 'Лицензия на разведку' },
  { value: 'MINERAL_OCCURRENCE', label: 'Рудопроявление' },
];

const PRICE_RANGES = [
  { label: 'До 1 млрд ₸', min: 0, max: 1000000000 },
  { label: '1-10 млрд ₸', min: 1000000000, max: 10000000000 },
  { label: '10-50 млрд ₸', min: 10000000000, max: 50000000000 },
  { label: 'Более 50 млрд ₸', min: 50000000000, max: undefined },
];

interface AdvancedSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
}

export default function AdvancedSearchNew({
  onSearch,
  className,
}: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searching, setSearching] = useState(false);

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMinerals, setSelectedMinerals] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>(
    {}
  );
  const [areaRange, setAreaRange] = useState<{ min?: number; max?: number }>(
    {}
  );
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load suggestions
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      searchService.getSuggestions(debouncedQuery).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Load filters from URL
  useEffect(() => {
    const query = searchParams.get('q');
    const types = searchParams.get('types');
    const minerals = searchParams.get('minerals');
    const regions = searchParams.get('regions');

    if (query) setSearchQuery(query);
    if (types) setSelectedTypes(types.split(','));
    if (minerals) setSelectedMinerals(minerals.split(','));
    if (regions) setSelectedRegions(regions.split(','));
  }, [searchParams]);

  const handleSearch = useCallback(async () => {
    setSearching(true);

    const filters: SearchFilters = {
      query: searchQuery,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      mineral: selectedMinerals.length > 0 ? selectedMinerals : undefined,
      region: selectedRegions.length > 0 ? selectedRegions : undefined,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      areaMin: areaRange.min,
      areaMax: areaRange.max,
      verified: onlyVerified || undefined,
      featured: onlyFeatured || undefined,
    };

    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTypes.length) params.set('types', selectedTypes.join(','));
    if (selectedMinerals.length)
      params.set('minerals', selectedMinerals.join(','));
    if (selectedRegions.length)
      params.set('regions', selectedRegions.join(','));
    if (priceRange.min) params.set('priceMin', priceRange.min.toString());
    if (priceRange.max) params.set('priceMax', priceRange.max.toString());
    if (onlyVerified) params.set('verified', 'true');
    if (onlyFeatured) params.set('featured', 'true');

    router.push(`/listings?${params.toString()}`);

    if (onSearch) {
      onSearch(filters);
    }

    setSearching(false);
  }, [
    searchQuery,
    selectedTypes,
    selectedMinerals,
    selectedRegions,
    priceRange,
    areaRange,
    onlyVerified,
    onlyFeatured,
    router,
    onSearch,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedMinerals([]);
    setSelectedRegions([]);
    setPriceRange({});
    setAreaRange({});
    setOnlyVerified(false);
    setOnlyFeatured(false);
    router.push('/listings');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length) count += selectedTypes.length;
    if (selectedMinerals.length) count += selectedMinerals.length;
    if (selectedRegions.length) count += selectedRegions.length;
    if (priceRange.min || priceRange.max) count++;
    if (areaRange.min || areaRange.max) count++;
    if (onlyVerified) count++;
    if (onlyFeatured) count++;
    return count;
  }, [
    selectedTypes,
    selectedMinerals,
    selectedRegions,
    priceRange,
    areaRange,
    onlyVerified,
    onlyFeatured,
  ]);

  return (
    <div className={cn('w-full', className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск месторождений, лицензий, минералов..."
              className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            leftIcon={<Filter className="w-4 h-4" />}
            className="relative"
          >
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            onClick={handleSearch}
            variant="default"
            loading={searching}
            leftIcon={!searching && <Search className="w-4 h-4" />}
          >
            Поиск
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg space-y-6">
          {/* Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Тип объекта
            </h3>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, option.value]);
                      } else {
                        setSelectedTypes(
                          selectedTypes.filter((t) => t !== option.value)
                        );
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mineral Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Минералы
            </h3>
            <div className="flex flex-wrap gap-2">
              {MINERAL_OPTIONS.map((mineral) => (
                <button
                  key={mineral}
                  onClick={() => {
                    if (selectedMinerals.includes(mineral)) {
                      setSelectedMinerals(
                        selectedMinerals.filter((m) => m !== mineral)
                      );
                    } else {
                      setSelectedMinerals([...selectedMinerals, mineral]);
                    }
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedMinerals.includes(mineral)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {mineral}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Регионы
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {REGION_OPTIONS.map((region) => (
                <label key={region} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRegions([...selectedRegions, region]);
                      } else {
                        setSelectedRegions(
                          selectedRegions.filter((r) => r !== region)
                        );
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Диапазон цен
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    if (
                      priceRange.min === range.min &&
                      priceRange.max === range.max
                    ) {
                      setPriceRange({});
                    } else {
                      setPriceRange({ min: range.min, max: range.max });
                    }
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    priceRange.min === range.min && priceRange.max === range.max
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Только проверенные</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => setOnlyFeatured(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Только рекомендуемые
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={clearFilters}
              leftIcon={<X className="w-4 h-4" />}
            >
              Сбросить фильтры
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" leftIcon={<Save className="w-4 h-4" />}>
                Сохранить поиск
              </Button>

              <Button
                onClick={handleSearch}
                variant="default"
                loading={searching}
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
