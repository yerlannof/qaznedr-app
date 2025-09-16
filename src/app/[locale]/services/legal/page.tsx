'use client';

import { useState, useMemo } from 'react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scale,
  MapPin,
  Star,
  Shield,
  Award,
  Phone,
  Mail,
  Clock,
  Users,
  BookOpen,
  FileText,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  User,
  Building,
} from 'lucide-react';
import { Card } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';

const legalExperts = [
  {
    id: '1',
    name: 'Айдын Қасымов',
    position: 'Управляющий партнер',
    company: 'Юр-Центр Недра',
    location: 'Алматы',
    rating: 4.9,
    reviews: 156,
    verified: true,
    experience: 15,
    specializations: [
      'Горное право',
      'Лицензирование',
      'M&A сделки',
      'Налоговое право',
    ],
    languages: ['Казахский', 'Русский', 'Английский'],
    successfulCases: 187,
    avatar: '/images/lawyers/lawyer-1.jpg',
    hourlyRate: 85000,
    responseTime: '< 2 часов',
    description:
      'Ведущий эксперт по горному праву Казахстана с опытом сопровождения крупнейших сделок в отрасли. Специализируется на лицензировании и слияниях в горнодобывающем секторе.',
    education: 'КазНУ им. аль-Фараби, юридический факультет',
    achievements: [
      'Лучший корпоративный юрист 2023',
      'Сделка года - Тенгизчевройл',
    ],
    recentCases: [
      'Лицензирование месторождения «Актогай-Север» - 2.5 млрд долларов',
      'Слияние KAZ Minerals с Polymetal - консультирование покупателя',
      'Реструктуризация Казцинка - налоговое планирование',
    ],
    contactPhone: '+7 727 123 4567',
    contactEmail: 'a.kasymov@nedra-law.kz',
    available: true,
  },
  {
    id: '2',
    name: 'Марина Петрова',
    position: 'Старший партнер',
    company: 'Горное Право КЗ',
    location: 'Нур-Султан',
    rating: 4.8,
    reviews: 134,
    verified: true,
    experience: 12,
    specializations: [
      'Экологическое право',
      'Недропользование',
      'Арбитраж',
      'Комплаенс',
    ],
    languages: ['Русский', 'Казахский', 'Английский', 'Немецкий'],
    successfulCases: 143,
    avatar: '/images/lawyers/lawyer-2.jpg',
    hourlyRate: 75000,
    responseTime: '< 4 часов',
    description:
      'Эксперт по экологическому праву и недропользованию. Имеет успешную практику защиты интересов крупных горнодобывающих компаний в международных арбитражах.',
    education: 'МГУ им. М.В.Ломоносова, МГИМО',
    achievements: ['Эколог года 2022', 'Арбитр международного уровня'],
    recentCases: [
      'Арбитраж Караганды vs Arcelor Mittal - защита экологических интересов',
      'Лицензия на разработку урановых месторождений для Казатомпрома',
      'Комплаенс программа для ERG в соответствии с международными стандартами',
    ],
    contactPhone: '+7 7172 234 5678',
    contactEmail: 'm.petrova@mining-law.kz',
    available: true,
  },
  {
    id: '3',
    name: 'Бекжан Нурланов',
    position: 'Ведущий консультант',
    company: 'АстанаЮрМайнинг',
    location: 'Нур-Султан',
    rating: 4.7,
    reviews: 98,
    verified: true,
    experience: 10,
    specializations: [
      'Контрактное право',
      'Валютное регулирование',
      'Банкротство',
      'Реорганизация',
    ],
    languages: ['Казахский', 'Русский', 'Английский'],
    successfulCases: 92,
    avatar: '/images/lawyers/lawyer-3.jpg',
    hourlyRate: 65000,
    responseTime: '< 6 часов',
    description:
      'Специалист по контрактному праву и валютному регулированию в горнодобывающей отрасли. Помогает компаниям структурировать международные сделки и соблюдать валютное законодательство.',
    education: 'КазГЮУ им. М.С. Нарикбаева',
    achievements: ['Консультант года 2023 по версии Legal Awards'],
    recentCases: [
      'Валютные операции для Polymetal International - 500 млн долларов',
      'Реструктуризация долгов Костанайские минералы',
      'Контракт на поставку оборудования Шубарколь Комир',
    ],
    contactPhone: '+7 7172 345 6789',
    contactEmail: 'b.nurlanov@astana-mining.kz',
    available: false,
  },
  {
    id: '4',
    name: 'Сауле Жаксылыкова',
    position: 'Управляющий партнер',
    company: 'Жетысу Лигал Групп',
    location: 'Алматы',
    rating: 4.9,
    reviews: 187,
    verified: true,
    experience: 18,
    specializations: [
      'Международное право',
      'Инвестиционные споры',
      'ICSID арбитраж',
      'Трансграничные сделки',
    ],
    languages: ['Казахский', 'Русский', 'Английский', 'Французский'],
    successfulCases: 231,
    avatar: '/images/lawyers/lawyer-4.jpg',
    hourlyRate: 95000,
    responseTime: '< 1 час',
    description:
      'Один из ведущих специалистов Казахстана по международному арбитражу и инвестиционным спорам. Представляла интересы государства и крупнейших компаний в ICSID и других международных арбитражах.',
    education: 'Гарвардская школа права, КазНУ им. аль-Фараби',
    achievements: [
      'Арбитр года 2022-2023',
      'Топ-5 юристов СНГ по версии Legal500',
    ],
    recentCases: [
      'ICSID арбитраж Stati vs Казахстан - защита государственных интересов',
      'Инвестиционный спор Карачаганак - медиация на 3 млрд долларов',
      'Международная сделка по приобретению медных активов в Жезказгане',
    ],
    contactPhone: '+7 727 456 7890',
    contactEmail: 's.zhaksylykova@jl-group.kz',
    available: true,
  },
  {
    id: '5',
    name: 'Данияр Абишев',
    position: 'Партнер',
    company: 'Майнинг Лоу Партнерс',
    location: 'Шымкент',
    rating: 4.6,
    reviews: 76,
    verified: true,
    experience: 8,
    specializations: [
      'Трудовое право',
      'Охрана труда',
      'Промышленная безопасность',
      'Социальная ответственность',
    ],
    languages: ['Казахский', 'Русский', 'Английский'],
    successfulCases: 68,
    avatar: '/images/lawyers/lawyer-5.jpg',
    hourlyRate: 55000,
    responseTime: '< 8 часов',
    description:
      'Эксперт по трудовому праву и промышленной безопасности в горнодобывающей отрасли. Специализируется на вопросах охраны труда, социальной ответственности и взаимодействия с профсоюзами.',
    education:
      'Каспийский университет, курсы повышения квалификации в Германии',
    achievements: ['Эксперт по охране труда 2023'],
    recentCases: [
      'Программа социальной ответственности для Казцинка в Восточно-Казахстанской области',
      'Трудовые споры на руднике Васильковское - урегулирование конфликта с профсоюзом',
      'Внедрение международных стандартов безопасности на Жайремском ГОКе',
    ],
    contactPhone: '+7 7252 567 8901',
    contactEmail: 'd.abishev@mining-partners.kz',
    available: true,
  },
  {
    id: '6',
    name: 'Алия Мухамедиева',
    position: 'Старший юрист',
    company: 'КазЛоу Майнинг',
    location: 'Караганда',
    rating: 4.5,
    reviews: 54,
    verified: false,
    experience: 6,
    specializations: [
      'Земельное право',
      'Градостроительство',
      'Разрешительные процедуры',
      'Муниципальное право',
    ],
    languages: ['Казахский', 'Русский'],
    successfulCases: 47,
    avatar: '/images/lawyers/lawyer-6.jpg',
    hourlyRate: 45000,
    responseTime: '< 12 часов',
    description:
      'Молодой перспективный юрист, специализирующийся на земельном праве и разрешительных процедурах. Помогает горнодобывающим компаниям получать необходимые разрешения и решать земельные вопросы.',
    education: 'КарГУ им. Е.А.Букетова',
    achievements: ['Молодой юрист года 2022 в Карагандинской области'],
    recentCases: [
      'Земельные вопросы для расширения Жезказганского медного комбината',
      'Разрешительные процедуры для строительства новой обогатительной фабрики',
      'Градостроительные согласования для инфраструктуры месторождения Бозшаколь',
    ],
    contactPhone: '+7 7212 678 9012',
    contactEmail: 'a.mukhamedieva@kazlaw-mining.kz',
    available: true,
  },
];

const regions = [
  'Все регионы',
  'Алматы',
  'Нур-Султан',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Семей',
  'Усть-Каменогорск',
  'Атырау',
  'Костанай',
  'Кызылорда',
  'Павлодар',
  'Петропавловск',
  'Уральск',
];

const specializations = [
  'Все специализации',
  'Горное право',
  'Лицензирование',
  'M&A сделки',
  'Экологическое право',
  'Недропользование',
  'Арбитраж',
  'Международное право',
  'Контрактное право',
  'Валютное регулирование',
  'Трудовое право',
  'Охрана труда',
  'Земельное право',
];

export default function LegalServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Все регионы');
  const [selectedSpecialization, setSelectedSpecialization] =
    useState('Все специализации');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [maxRate, setMaxRate] = useState(100000);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<
    'rating' | 'experience' | 'rate' | 'reviews'
  >('rating');

  const filteredExperts = useMemo(() => {
    const filtered = legalExperts.filter((expert) => {
      const matchesSearch =
        !searchQuery ||
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specializations.some((spec) =>
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesRegion =
        selectedRegion === 'Все регионы' || expert.location === selectedRegion;
      const matchesSpecialization =
        selectedSpecialization === 'Все специализации' ||
        expert.specializations.includes(selectedSpecialization);
      const matchesVerified = !verifiedOnly || expert.verified;
      const matchesAvailable = !availableOnly || expert.available;
      const matchesRating = expert.rating >= ratingFilter;
      const matchesRate = expert.hourlyRate <= maxRate;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesSpecialization &&
        matchesVerified &&
        matchesAvailable &&
        matchesRating &&
        matchesRate
      );
    });

    // Сортировка - создаем отсортированную копию
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    searchQuery,
    selectedRegion,
    selectedSpecialization,
    verifiedOnly,
    availableOnly,
    ratingFilter,
    maxRate,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Hero Section */}
      <div className="bg-blue-600 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="text-center">
            <Scale className="w-16 h-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Юридические эксперты по горному праву
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Найдите проверенных юристов и консультантов, специализирующихся на
              горнодобывающей отрасли Казахстана. От лицензирования до
              международных арбитражей.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найдите эксперта по имени, компании или специализации..."
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
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Region Filter */}
            <div className="flex-1">
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

            {/* Specialization Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Специализация
              </label>
              <div className="relative">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="flex-1">
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

            {/* Rate Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Макс. ставка, ₸/час
              </label>
              <input
                type="number"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="5000"
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
                  <option value="experience">По опыту</option>
                  <option value="rate">По ставке</option>
                  <option value="reviews">По отзывам</option>
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
              {filteredExperts.length}
            </span>{' '}
            экспертов
          </p>
        </div>

        {/* Experts Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          {filteredExperts.map((expert) => (
            <Card
              key={expert.id}
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
                      alt={expert.name}
                      fill
                      className="rounded-full object-cover"
                    />
                    {expert.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {!expert.available && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-white opacity-75" />
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Header */}
                  <div
                    className={`${viewMode === 'list' ? 'flex justify-between items-start mb-3' : 'mb-3'}`}
                  >
                    <div className={viewMode === 'list' ? '' : 'text-center'}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {expert.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        {expert.position}
                      </p>
                      <p className="font-medium text-blue-600 text-sm">
                        {expert.company}
                      </p>
                    </div>

                    <div
                      className={`${viewMode === 'list' ? 'text-right' : 'flex justify-center items-center gap-4 mt-3'}`}
                    >
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{expert.rating}</span>
                        <span className="text-gray-500 text-sm">
                          ({expert.reviews})
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
                      <span>{expert.location}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${expert.available ? 'text-green-600' : 'text-red-600'}`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>
                        {expert.available ? expert.responseTime : 'Недоступен'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div
                    className={`${viewMode === 'list' ? 'flex gap-6' : 'grid grid-cols-3 gap-2'} mb-4 text-center text-sm`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {expert.experience}
                      </div>
                      <div className="text-gray-600">лет опыта</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {expert.successfulCases}
                      </div>
                      <div className="text-gray-600">дел</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {expert.hourlyRate.toLocaleString()} ₸
                      </div>
                      <div className="text-gray-600">за час</div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {expert.specializations.slice(0, 3).map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                      {expert.specializations.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{expert.specializations.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {viewMode === 'list' && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {expert.description}
                    </p>
                  )}

                  {/* Contact Buttons */}
                  <div
                    className={`${viewMode === 'list' ? 'flex' : 'grid grid-cols-2'} gap-2`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      disabled={!expert.available}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Позвонить
                    </Button>
                    <Button size="sm" disabled={!expert.available}>
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
          <Scale className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-4">Юрист по горному праву?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Присоединяйтесь к нашей базе экспертов и найдите новых клиентов в
            горнодобывающей отрасли Казахстана
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <User className="w-4 h-4 mr-2" />
              Создать профиль эксперта
            </Button>
            <Button
              variant="outline"
              className="border-blue-400 text-white hover:bg-blue-700"
            >
              <Building className="w-4 h-4 mr-2" />
              Зарегистрировать компанию
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
