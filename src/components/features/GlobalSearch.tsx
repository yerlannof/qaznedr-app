'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  Mountain,
  Building2,
  FileText,
  Newspaper,
  BookOpen,
  Users,
  Briefcase,
  MapPin,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'listing' | 'company' | 'service' | 'news' | 'knowledge';
  href: string;
  icon?: React.ReactNode;
  meta?: string;
}

// Mock search data - в реальном приложении это будет API запрос
const mockSearchData: SearchResult[] = [
  // Listings
  {
    id: '1',
    title: 'Золоторудное месторождение Бакырчик',
    description: 'Восточно-Казахстанская область',
    type: 'listing',
    href: '/listings/1',
    icon: <Mountain className="w-4 h-4" />,
    meta: '45,000,000 ₸',
  },
  {
    id: '2',
    title: 'Медное месторождение Актогай',
    description: 'Карагандинская область',
    type: 'listing',
    href: '/listings/2',
    icon: <Mountain className="w-4 h-4" />,
    meta: '120,000,000 ₸',
  },
  // Companies
  {
    id: '3',
    title: 'КазМинералс',
    description: 'Ведущая горнодобывающая компания',
    type: 'company',
    href: '/companies/kazminerals',
    icon: <Building2 className="w-4 h-4" />,
    meta: 'Верифицирована',
  },
  // Services
  {
    id: '4',
    title: 'Геологические услуги',
    description: 'Геологоразведка и картографирование',
    type: 'service',
    href: '/services/geological',
    icon: <Briefcase className="w-4 h-4" />,
    meta: '47 поставщиков',
  },
  {
    id: '5',
    title: 'Юридические услуги',
    description: 'Горное право и лицензирование',
    type: 'service',
    href: '/services/legal',
    icon: <FileText className="w-4 h-4" />,
    meta: '6 экспертов',
  },
  // News
  {
    id: '6',
    title: 'Казахстан увеличивает добычу золота',
    description: 'Последние новости отрасли',
    type: 'news',
    href: '/news/6',
    icon: <Newspaper className="w-4 h-4" />,
    meta: '2 часа назад',
  },
  // Knowledge
  {
    id: '7',
    title: 'Как получить лицензию на недропользование',
    description: 'Пошаговое руководство',
    type: 'knowledge',
    href: '/knowledge/7',
    icon: <BookOpen className="w-4 h-4" />,
    meta: 'Руководство',
  },
];

const typeLabels = {
  listing: 'Месторождения',
  company: 'Компании',
  service: 'Услуги',
  news: 'Новости',
  knowledge: 'База знаний',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false); // Ensure dialog starts closed
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setResults(mockSearchData.slice(0, 5)); // Show recent/popular items
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = mockSearchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.meta?.toLowerCase().includes(query)
    );
    setResults(filtered);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors md:w-64"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog - Only render when open */}
      {open && (
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Поиск"
          description="Найдите месторождения, компании и услуги"
        >
          <CommandInput
            placeholder="Поиск месторождений, компаний, услуг..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Ничего не найдено.</CommandEmpty>

            {Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup
                key={type}
                heading={typeLabels[type as keyof typeof typeLabels]}
              >
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-start gap-3 py-3"
                  >
                    <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.meta && (
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {item.meta}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandSeparator />
            <CommandGroup heading="Быстрые действия">
              <CommandItem onSelect={() => handleSelect('/listings/create')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Разместить объявление
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/dashboard')}>
                <Users className="w-4 h-4 mr-2" />
                Мой кабинет
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/services')}>
                <Briefcase className="w-4 h-4 mr-2" />
                Все услуги
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
