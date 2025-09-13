'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  MapPin,
  Star,
  Shield,
  Award,
  Phone,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  Building2,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  User,
  Plus,
  BarChart3,
  Target,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button-new';

const investors = [
  {
    id: '1',
    name: 'Нурлан Смагулов',
    position: 'Управляющий партнер',
    company: 'КазИнвест Майнинг',
    type: 'individual', // 'individual' | 'fund' | 'bank'
    location: 'Алматы',
    rating: 4.8,
    reviews: 67,
    verified: true,
    totalInvested: 15700000000, // в тенге
    activeProjects: 12,
    successRate: 89,
    avatar: '/images/investors/investor-1.jpg',
    investmentRange: { min: 500000000, max: 5000000000 }, // в тенге
    responseTime: '< 24 часов',
    description:
      'Опытный инвестор в горнодобывающий сектор с портфолио из 12 активных проектов. Специализируется на золотодобыче и медных месторождениях.',
    focusAreas: ['Золото', 'Медь', 'Цинк', 'Полиметаллы'],
    investmentStages: [
      'Разведка',
      'Подготовка к добыче',
      'Действующие рудники',
    ],
    regions: [
      'Восточно-Казахстанская обл.',
      'Карагандинская обл.',
      'Павлодарская обл.',
    ],
    recentInvestments: [
      {
        project: 'Золоторудное месторождение "Жолымбет"',
        amount: 2500000000,
        year: 2023,
      },
      {
        project: 'Медный рудник "Актогай-Восток"',
        amount: 3200000000,
        year: 2022,
      },
      {
        project: 'Полиметаллическое месторождение "Шалкия"',
        amount: 1800000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 727 123 4567',
    contactEmail: 'n.smagulov@kazinvest-mining.kz',
    available: true,
    lookingFor:
      'Ищу перспективные золотые и медные месторождения на стадии завершения разведки',
  },
  {
    id: '2',
    name: 'Алтын Инвест Фонд',
    position: 'Инвестиционный фонд',
    company: 'Altyn Invest Fund',
    type: 'fund',
    location: 'Нур-Султан',
    rating: 4.9,
    reviews: 134,
    verified: true,
    totalInvested: 45200000000,
    activeProjects: 28,
    successRate: 92,
    avatar: '/images/investors/investor-2.jpg',
    investmentRange: { min: 1000000000, max: 15000000000 },
    responseTime: '< 48 часов',
    description:
      'Ведущий казахстанский фонд прямых инвестиций, специализирующийся на горнодобывающих проектах. Управляет активами на сумму более 50 млрд тенге.',
    focusAreas: ['Золото', 'Серебро', 'Медь', 'Железная руда', 'Уголь'],
    investmentStages: [
      'Геологическая разведка',
      'Технико-экономическое обоснование',
      'Строительство',
      'Действующее производство',
    ],
    regions: ['Вся территория Казахстана'],
    recentInvestments: [
      {
        project: 'ГОК "Бозшаколь" - расширение',
        amount: 12000000000,
        year: 2023,
      },
      {
        project: 'Угольное месторождение "Майкубен-Запад"',
        amount: 7500000000,
        year: 2023,
      },
      {
        project: 'Железорудное месторождение "Соколовское-2"',
        amount: 9200000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 7172 234 5678',
    contactEmail: 'info@altyn-fund.kz',
    available: true,
    lookingFor:
      'Рассматриваем крупные проекты с потенциалом IRR свыше 18% и сроком окупаемости до 7 лет',
  },
  {
    id: '3',
    name: 'Казахстанский Банк Развития',
    position: 'Банк развития',
    company: 'БРК',
    type: 'bank',
    location: 'Алматы',
    rating: 4.7,
    reviews: 89,
    verified: true,
    totalInvested: 127500000000,
    activeProjects: 45,
    successRate: 87,
    avatar: '/images/investors/investor-3.jpg',
    investmentRange: { min: 2000000000, max: 25000000000 },
    responseTime: '< 72 часов',
    description:
      'Национальный институт развития, обеспечивающий долгосрочное финансирование производственной инфраструктуры и промышленных проектов.',
    focusAreas: [
      'Все минералы',
      'Инфраструктурные проекты',
      'Обогатительные комплексы',
    ],
    investmentStages: [
      'ТЭО',
      'Строительство',
      'Модернизация действующих предприятий',
    ],
    regions: ['Вся территория Казахстана', 'Приоритет - индустриальные зоны'],
    recentInvestments: [
      {
        project: 'Модернизация Жезказганского медеплавильного завода',
        amount: 18000000000,
        year: 2023,
      },
      {
        project: 'Строительство обогатительной фабрики "Костанай Минералс"',
        amount: 15600000000,
        year: 2023,
      },
      {
        project:
          'Развитие железнодорожной инфраструктуры месторождения "Кокжайлау"',
        amount: 11200000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 727 345 6789',
    contactEmail: 'mining@kdb.kz',
    available: true,
    lookingFor:
      'Финансируем проекты по диверсификации экономики с высоким экспортным потенциалом',
  },
  {
    id: '4',
    name: 'Дарья Волкова',
    position: 'Частный инвестор',
    company: 'Nedra Capital',
    type: 'individual',
    location: 'Нур-Султан',
    rating: 4.6,
    reviews: 43,
    verified: true,
    totalInvested: 8900000000,
    activeProjects: 7,
    successRate: 86,
    avatar: '/images/investors/investor-4.jpg',
    investmentRange: { min: 300000000, max: 2500000000 },
    responseTime: '< 12 часов',
    description:
      'Частный инвестор с 8-летним опытом в горнодобывающей отрасли. Фокусируется на средних и малых месторождениях с быстрой окупаемостью.',
    focusAreas: [
      'Россыпное золото',
      'Строительные материалы',
      'Техногенные месторождения',
    ],
    investmentStages: [
      'Начальная разведка',
      'Опытная добыча',
      'Малая горная техника',
    ],
    regions: [
      'Акмолинская обл.',
      'Северо-Казахстанская обл.',
      'Костанайская обл.',
    ],
    recentInvestments: [
      { project: 'Россыпное золото "Жана-Жол"', amount: 850000000, year: 2023 },
      {
        project: 'Песчано-гравийное месторождение "Сарыарка"',
        amount: 650000000,
        year: 2023,
      },
      {
        project: 'Техногенное месторождение "Балхаш-Золото"',
        amount: 1200000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 7172 456 7890',
    contactEmail: 'd.volkova@nedra-capital.kz',
    available: false,
    lookingFor:
      'Интересуют проекты сроком окупаемости до 3 лет с минимальными экологическими рисками',
  },
  {
    id: '5',
    name: 'Мирас Алтынбеков',
    position: 'Директор по инвестициям',
    company: 'Qazaq Mining Invest',
    type: 'fund',
    location: 'Шымкент',
    rating: 4.5,
    reviews: 56,
    verified: true,
    totalInvested: 11300000000,
    activeProjects: 9,
    successRate: 83,
    avatar: '/images/investors/investor-5.jpg',
    investmentRange: { min: 400000000, max: 3000000000 },
    responseTime: '< 36 часов',
    description:
      'Региональный инвестиционный фонд, специализирующийся на развитии горнодобывающих проектов южного Казахстана. Поддерживаем местных предпринимателей.',
    focusAreas: [
      'Свинцово-цинковые руды',
      'Барит',
      'Плавиковый шпат',
      'Каолин',
    ],
    investmentStages: [
      'Детальная разведка',
      'Подготовка к эксплуатации',
      'Первые годы эксплуатации',
    ],
    regions: [
      'Южно-Казахстанская обл.',
      'Жамбылская обл.',
      'Кызылординская обл.',
    ],
    recentInvestments: [
      {
        project: 'Свинцово-цинковое месторождение "Жайрем-Южное"',
        amount: 2100000000,
        year: 2023,
      },
      {
        project: 'Баритовое месторождение "Жезды"',
        amount: 980000000,
        year: 2022,
      },
      {
        project: 'Каолиновое месторождение "Криворожское"',
        amount: 1450000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 7252 567 8901',
    contactEmail: 'm.altynbekov@qazaq-mining.kz',
    available: true,
    lookingFor:
      'Ищем проекты по редким и редкоземельным металлам в южных регионах',
  },
  {
    id: '6',
    name: 'Евразийский Инвест',
    position: 'Международный фонд',
    company: 'Eurasian Mining Fund',
    type: 'fund',
    location: 'Алматы',
    rating: 4.8,
    reviews: 112,
    verified: true,
    totalInvested: 89600000000,
    activeProjects: 31,
    successRate: 91,
    avatar: '/images/investors/investor-6.jpg',
    investmentRange: { min: 3000000000, max: 20000000000 },
    responseTime: '< 5 дней',
    description:
      'Международный фонд с капиталом более 100 млрд тенге. Инвестируем в крупные горнодобывающие проекты с международным потенциалом экспорта.',
    focusAreas: [
      'Медь',
      'Золото',
      'Уран',
      'Редкоземельные металлы',
      'Калийные соли',
    ],
    investmentStages: [
      'Подтвержденные запасы',
      'Строительство ГОКов',
      'Модернизация действующих предприятий',
    ],
    regions: [
      'Вся территория Казахстана',
      'Фокус на экспортно-ориентированных проектах',
    ],
    recentInvestments: [
      {
        project: 'Урановое месторождение "Инкай" - расширение',
        amount: 19500000000,
        year: 2023,
      },
      {
        project: 'Медно-порфировое месторождение "Актогай-Север"',
        amount: 16800000000,
        year: 2023,
      },
      {
        project: 'Золоторудное месторождение "Васильковское" - модернизация',
        amount: 12300000000,
        year: 2022,
      },
    ],
    contactPhone: '+7 727 678 9012',
    contactEmail: 'investment@eurasian-mining.kz',
    available: true,
    lookingFor:
      'Крупные проекты мирового класса с запасами категории С1+С2 и экспортным потенциалом',
  },
];

const regions = [
  'Все регионы',
  'Алматы',
  'Нур-Султан',
  'Шымкент',
  'Караганда',
  'Восточно-Казахстанская обл.',
  'Карагандинская обл.',
  'Павлодарская обл.',
  'Акмолинская обл.',
  'Костанайская обл.',
  'Атырауская обл.',
  'Мангистауская обл.',
  'Актюбинская обл.',
  'Жамбылская обл.',
  'Кызылординская обл.',
];

const investorTypes = ['Все типы', 'individual', 'fund', 'bank'];

const investorTypeNames = {
  individual: 'Частный инвестор',
  fund: 'Инвестиционный фонд',
  bank: 'Банк/Финансовая организация',
};

const focusAreas = [
  'Все области',
  'Золото',
  'Медь',
  'Серебро',
  'Цинк',
  'Уран',
  'Железная руда',
  'Уголь',
  'Редкоземельные металлы',
  'Строительные материалы',
  'Полиметаллы',
];

export default function InvestorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Все регионы');
  const [selectedType, setSelectedType] = useState('Все типы');
  const [selectedFocus, setSelectedFocus] = useState('Все области');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [minInvestment, setMinInvestment] = useState(0);
  const [maxInvestment, setMaxInvestment] = useState(50000000000);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<
    'rating' | 'totalInvested' | 'activeProjects' | 'successRate'
  >('rating');

  const filteredInvestors = useMemo(() => {
    const filtered = investors.filter((investor) => {
      const matchesSearch =
        !searchQuery ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.focusAreas.some((area) =>
          area.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesRegion =
        selectedRegion === 'Все регионы' ||
        investor.location === selectedRegion ||
        investor.regions.includes(selectedRegion);
      const matchesType =
        selectedType === 'Все типы' || investor.type === selectedType;
      const matchesFocus =
        selectedFocus === 'Все области' ||
        investor.focusAreas.includes(selectedFocus);
      const matchesVerified = !verifiedOnly || investor.verified;
      const matchesAvailable = !availableOnly || investor.available;
      const matchesRating = investor.rating >= ratingFilter;
      const matchesInvestmentRange =
        investor.investmentRange.min <= maxInvestment &&
        investor.investmentRange.max >= minInvestment;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesType &&
        matchesFocus &&
        matchesVerified &&
        matchesAvailable &&
        matchesRating &&
        matchesInvestmentRange
      );
    });

    // Сортировка - создаем отсортированную копию
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'totalInvested':
          return b.totalInvested - a.totalInvested;
        case 'activeProjects':
          return b.activeProjects - a.activeProjects;
        case 'successRate':
          return b.successRate - a.successRate;
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    searchQuery,
    selectedRegion,
    selectedType,
    selectedFocus,
    verifiedOnly,
    availableOnly,
    ratingFilter,
    minInvestment,
    maxInvestment,
    sortBy,
  ]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + ' млрд ₸';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(0) + ' млн ₸';
    }
    return amount.toLocaleString() + ' ₸';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Инвесторы и фонды
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Найдите инвесторов для финансирования вашего горнодобывающего
              проекта. От частных инвесторов до крупных фондов и банков
              развития.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найдите инвестора по имени, компании или сфере интересов..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              <Button
                size="icon"
                className="absolute right-2 top-2 rounded-full"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Регион
              </label>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип инвестора
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {investorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'Все типы'
                        ? type
                        : investorTypeNames[
                            type as keyof typeof investorTypeNames
                          ]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Focus Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сфера интересов
              </label>
              <div className="relative">
                <select
                  value={selectedFocus}
                  onChange={(e) => setSelectedFocus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {focusAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Мин. рейтинг
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-[3rem]">
                  {ratingFilter}+
                </span>
              </div>
            </div>
          </div>

          {/* Investment Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Мин. инвестиция, млн ₸
              </label>
              <input
                type="number"
                value={minInvestment / 1000000}
                onChange={(e) =>
                  setMinInvestment(Number(e.target.value) * 1000000)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Макс. инвестиция, млн ₸
              </label>
              <input
                type="number"
                value={maxInvestment / 1000000}
                onChange={(e) =>
                  setMaxInvestment(Number(e.target.value) * 1000000)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  Только верифицированные
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Только доступные</span>
              </label>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rating">По рейтингу</option>
                  <option value="totalInvested">По объему инвестиций</option>
                  <option value="activeProjects">По кол-ву проектов</option>
                  <option value="successRate">По успешности</option>
                </select>
              </div>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Найдено{' '}
            <span className="font-semibold text-gray-900">
              {filteredInvestors.length}
            </span>{' '}
            инвесторов
          </p>
        </div>

        {/* Investors Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          {filteredInvestors.map((investor) => (
            <Card
              key={investor.id}
              className={`group hover:shadow-xl transition-all duration-300 ${viewMode === 'list' ? 'p-6' : ''}`}
            >
              <div
                className={`${viewMode === 'list' ? 'flex gap-6' : 'text-center'}`}
              >
                {/* Avatar and Basic Info */}
                <div
                  className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}
                >
                  <div
                    className={`relative ${viewMode === 'list' ? 'w-24 h-24' : 'w-20 h-20 mx-auto'} mb-3`}
                  >
                    <Image
                      src="/images/placeholder-avatar.jpg"
                      alt={investor.name}
                      fill
                      className="rounded-full object-cover"
                    />
                    {investor.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {!investor.available && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-white opacity-75" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`${viewMode === 'list' ? 'text-center' : ''}`}
                  >
                    <div
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        investor.type === 'fund'
                          ? 'bg-blue-100 text-blue-700'
                          : investor.type === 'bank'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {
                        investorTypeNames[
                          investor.type as keyof typeof investorTypeNames
                        ]
                      }
                    </div>
                  </div>
                </div>

                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Header */}
                  <div
                    className={`${viewMode === 'list' ? 'flex justify-between items-start mb-3' : 'mb-3'}`}
                  >
                    <div className={viewMode === 'list' ? '' : 'text-center'}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {investor.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        {investor.position}
                      </p>
                      <p className="font-medium text-blue-600 text-sm">
                        {investor.company}
                      </p>
                    </div>

                    <div
                      className={`${viewMode === 'list' ? 'text-right' : 'flex justify-center items-center gap-4 mt-3'}`}
                    >
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{investor.rating}</span>
                        <span className="text-gray-500 text-sm">
                          ({investor.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location and Availability */}
                  <div
                    className={`flex ${viewMode === 'list' ? 'justify-between' : 'justify-center'} items-center gap-4 mb-4 text-sm text-gray-600`}
                  >
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{investor.location}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${investor.available ? 'text-green-600' : 'text-red-600'}`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>
                        {investor.available
                          ? investor.responseTime
                          : 'Недоступен'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div
                    className={`${viewMode === 'list' ? 'grid grid-cols-4 gap-4' : 'grid grid-cols-2 gap-2'} mb-4 text-center text-sm`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatAmount(investor.totalInvested)}
                      </div>
                      <div className="text-gray-600">инвестировано</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {investor.activeProjects}
                      </div>
                      <div className="text-gray-600">проектов</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {investor.successRate}%
                      </div>
                      <div className="text-gray-600">успех</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatAmount(investor.investmentRange.min)} -{' '}
                        {formatAmount(investor.investmentRange.max)}
                      </div>
                      <div className="text-gray-600">диапазон</div>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {investor.focusAreas.slice(0, 3).map((area, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                      {investor.focusAreas.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{investor.focusAreas.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Looking For */}
                  {viewMode === 'list' && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 italic">
                        {investor.lookingFor}
                      </p>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div
                    className={`${viewMode === 'list' ? 'flex' : 'grid grid-cols-2'} gap-2`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      disabled={!investor.available}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Позвонить
                    </Button>
                    <Button size="sm" disabled={!investor.available}>
                      <Mail className="w-4 h-4 mr-2" />
                      Написать
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <section className="bg-blue-600 rounded-2xl p-8 text-center text-white mt-16">
          <Users className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-4">
            Ищете финансирование для проекта?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Создайте профиль проекта и привлеките внимание инвесторов к вашему
            горнодобывающему предприятию
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать профиль проекта
            </Button>
            <Button
              variant="outline"
              className="border-blue-400 text-white hover:bg-blue-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Посмотреть статистику
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
