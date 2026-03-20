'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Droplets,
  Flame,
  Gem,
  Hexagon,
  MapPin,
  Building2,
  Search,
  type LucideIcon,
} from 'lucide-react';
// import { REGIONS, MINERALS } from '@/lib/types/listing';

interface SearchResult {
  item: {
    title: string;
    type: string;
    icon?: LucideIcon;
    score?: number;
  };
  score?: number;
}

export default function AdvancedSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [fuzzyResults, setFuzzyResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  // Fuzzy search с динамической загрузкой Fuse.js
  const performFuzzySearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setFuzzyResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Динамически загружаем Fuse.js
      const Fuse = (await import('fuse.js')).default;

      // Данные для поиска (в реальном приложении это будет из API)
      const searchData = [
        { type: 'region', name: 'Мангистауская область', icon: MapPin },
        { type: 'region', name: 'Атырауская область', icon: MapPin },
        { type: 'region', name: 'Западно-Казахстанская область', icon: MapPin },
        { type: 'mineral', name: 'Нефть', icon: Droplets },
        { type: 'mineral', name: 'Газ', icon: Flame },
        { type: 'mineral', name: 'Золото', icon: Gem },
        { type: 'mineral', name: 'Медь', icon: Hexagon },
        { type: 'deposit', name: 'Кашаган', icon: Droplets },
        { type: 'deposit', name: 'Тенгиз', icon: Droplets },
        { type: 'deposit', name: 'Карачаганак', icon: Flame },
        { type: 'city', name: 'Атырау', icon: Building2 },
        { type: 'city', name: 'Актау', icon: Building2 },
        { type: 'city', name: 'Уральск', icon: Building2 },
      ];

      const fuse = new Fuse(searchData, {
        keys: ['name'],
        threshold: 0.3,
        includeScore: true,
      });

      const results = fuse.search(query);
      // Преобразуем результаты в нужный формат
      const formattedResults: SearchResult[] = results
        .slice(0, 6)
        .map((result) => ({
          item: {
            title: result.item.name,
            type: result.item.type,
            icon: result.item.icon,
            score: result.score,
          },
          score: result.score,
        }));
      setFuzzyResults(formattedResults);
    } catch (error) {
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performFuzzySearch(searchQuery);
        setShowSuggestions(true);
      } else {
        setFuzzyResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performFuzzySearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const queryString = createQueryString('q', searchQuery.trim());
      router.push(`${pathname}?${queryString}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    const item = suggestion.item;

    let queryString = '';
    switch (item.type) {
      case 'region':
        queryString = createQueryString('region', item.title);
        break;
      case 'mineral':
        queryString = createQueryString('mineral', item.title);
        break;
      case 'deposit':
      case 'city':
      default:
        queryString = createQueryString('q', item.title);
        break;
    }

    router.push(`${pathname}?${queryString}`);
    setSearchQuery(item.title);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск месторождений, регионов, минералов..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => fuzzyResults.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {isSearching ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && fuzzyResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Предложения:</div>
            {fuzzyResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(result)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center space-x-3 transition-colors"
              >
                {result.item.icon && (
                  <result.item.icon className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {result.item.title}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {result.item.type}
                  </div>
                </div>
                {result.score && (
                  <div className="ml-auto text-xs text-gray-400">
                    {Math.round((1 - result.score) * 100)}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
