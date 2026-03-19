'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layouts/Navigation';
import Image from 'next/image';
import {
  Mountain,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Users,
  Award,
  Briefcase,
  Clock,
  Filter,
  Search,
  Map as MapIcon,
  Grid3X3,
  ChevronDown,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Card, CardBadge } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';

interface GeologicalProvider {
  id: string;
  name: string;
  description: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    region: string;
    coordinates: [number, number];
  };
  services: string[];
  specializations: string[];
  experience: number;
  projectsCount: number;
  certified: boolean;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  established: number;
  teamSize: number;
}

const GEOLOGICAL_SERVICES = [
  'Геологическая разведка',
  'Геофизические исследования',
  'Геохимический анализ',
  'Бурение разведочных скважин',
  'Картографирование',
  'Сейсмическое зондирование',
  'Петрографический анализ',
  'Подсчет запасов',
  'Экологическое картирование',
  'Гидрогеологические изыскания',
];

const REGIONS = [
  'Алматинская область',
  'Нур-Султан',
  'Алматы',
  'Карагандинская область',
  'Павлодарская область',
  'Восточно-Казахстанская область',
  'Жамбылская область',
  'Туркестанская область',
  'Мангистауская область',
  'Атырауская область',
  'Западно-Казахстанская область',
  'Актюбинская область',
  'Костанайская область',
  'Северо-Казахстанская область',
];

const geologicalProviders: GeologicalProvider[] = [
  {
    id: '1',
    name: 'КазГеоСервис',
    description:
      'Ведущая геологоразведочная компания с 25-летним опытом работы. Специализируемся на комплексных геологических исследованиях и разведке месторождений полезных ископаемых.',
    rating: 4.8,
    reviewCount: 34,
    location: {
      city: 'Алматы',
      region: 'Алматинская область',
      coordinates: [76.9129, 43.2567],
    },
    services: [
      'Геологическая разведка',
      'Геофизические исследования',
      'Бурение разведочных скважин',
      'Подсчет запасов',
    ],
    specializations: ['Золото', 'Медь', 'Уголь'],
    experience: 25,
    projectsCount: 187,
    certified: true,
    contact: {
      phone: '+7 727 345 6789',
      email: 'info@kazgeoservice.kz',
      website: 'https://kazgeoservice.kz',
    },
    established: 1999,
    teamSize: 67,
  },
  {
    id: '2',
    name: 'Геопроспект КЗ',
    description:
      'Инновационная геологическая компания, применяющая современные методы дистанционного зондирования и 3D-моделирования для геологической разведки.',
    rating: 4.9,
    reviewCount: 28,
    location: {
      city: 'Нур-Султан',
      region: 'Акмолинская область',
      coordinates: [71.4704, 51.1694],
    },
    services: [
      'Геохимический анализ',
      'Картографирование',
      'Сейсмическое зондирование',
      'Экологическое картирование',
    ],
    specializations: ['Нефть', 'Газ', 'Уран'],
    experience: 18,
    projectsCount: 143,
    certified: true,
    contact: {
      phone: '+7 717 234 5678',
      email: 'contact@geoprospect.kz',
      website: 'https://geoprospect.kz',
    },
    established: 2006,
    teamSize: 45,
  },
  {
    id: '3',
    name: 'Недра-Геология',
    description:
      'Специализируемся на комплексном геологическом изучении недр, включая поиски и разведку твердых полезных ископаемых на территории Казахстана.',
    rating: 4.7,
    reviewCount: 19,
    location: {
      city: 'Караганда',
      region: 'Карагандинская область',
      coordinates: [73.1526, 49.8047],
    },
    services: [
      'Петрографический анализ',
      'Гидрогеологические изыскания',
      'Геологическая разведка',
      'Подсчет запасов',
    ],
    specializations: ['Железная руда', 'Марганец', 'Титан'],
    experience: 22,
    projectsCount: 165,
    certified: true,
    contact: {
      phone: '+7 721 456 7890',
      email: 'info@nedra-geology.kz',
    },
    established: 2002,
    teamSize: 53,
  },
  {
    id: '4',
    name: 'АлтайГео',
    description:
      'Региональная геологическая компания, специализирующаяся на геологической разведке месторождений драгоценных и цветных металлов в Восточном Казахстане.',
    rating: 4.6,
    reviewCount: 15,
    location: {
      city: 'Усть-Каменогорск',
      region: 'Восточно-Казахстанская область',
      coordinates: [82.6133, 49.9481],
    },
    services: [
      'Геологическая разведка',
      'Геофизические исследования',
      'Бурение разведочных скважин',
    ],
    specializations: ['Золото', 'Серебро', 'Свинец', 'Цинк'],
    experience: 16,
    projectsCount: 89,
    certified: false,
    contact: {
      phone: '+7 723 567 8901',
      email: 'altaigeo@mail.kz',
    },
    established: 2008,
    teamSize: 31,
  },
  {
    id: '5',
    name: 'КаспийГеология',
    description:
      'Ведущий поставщик геологических услуг в Западном Казахстане. Специализируемся на нефтегазовой геологии и морских геологических исследованиях.',
    rating: 4.8,
    reviewCount: 22,
    location: {
      city: 'Актау',
      region: 'Мангистауская область',
      coordinates: [51.2133, 43.6564],
    },
    services: [
      'Сейсмическое зондирование',
      'Геохимический анализ',
      'Экологическое картирование',
    ],
    specializations: ['Нефть', 'Газ'],
    experience: 20,
    projectsCount: 124,
    certified: true,
    contact: {
      phone: '+7 729 678 9012',
      email: 'info@caspiangeology.kz',
      website: 'https://caspiangeology.kz',
    },
    established: 2004,
    teamSize: 38,
  },
];

export default function GeologicalServicesPage() {
  const [providers, setProviders] =
    useState<GeologicalProvider[]>(geologicalProviders);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort providers
  useEffect(() => {
    let filtered = [...geologicalProviders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          provider.specializations.some((spec) =>
            spec.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(
        (provider) => provider.location.region === selectedRegion
      );
    }

    // Service filter
    if (selectedService !== 'all') {
      filtered = filtered.filter((provider) =>
        provider.services.includes(selectedService)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'experience':
        filtered.sort((a, b) => b.experience - a.experience);
        break;
      case 'projects':
        filtered.sort((a, b) => b.projectsCount - a.projectsCount);
        break;
      default:
        break;
    }

    setProviders(filtered);
  }, [searchQuery, selectedRegion, selectedService, sortBy]);

  const renderProviderCard = (provider: GeologicalProvider) => (
    <Card
      key={provider.id}
      variant="elevated"
      className="hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {provider.logo ? (
            <Image
              src={provider.logo}
              alt={provider.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <Mountain className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {provider.name}
                {provider.certified && (
                  <Shield className="w-5 h-5 text-green-600" />
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {provider.location.city}, {provider.location.region}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{provider.rating}</span>
              <span className="text-sm text-gray-500">
                ({provider.reviewCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {provider.description}
      </p>

      {/* Specializations */}
      <div className="flex flex-wrap gap-2 mb-4">
        {provider.specializations.slice(0, 3).map((spec) => (
          <CardBadge key={spec} variant="info" className="text-xs">
            {spec}
          </CardBadge>
        ))}
        {provider.specializations.length > 3 && (
          <CardBadge variant="default" className="text-xs">
            +{provider.specializations.length - 3}
          </CardBadge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-3 mb-4 border-t border-b border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {provider.experience}
          </div>
          <div className="text-xs text-gray-500">лет опыта</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {provider.projectsCount}
          </div>
          <div className="text-xs text-gray-500">проектов</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {provider.teamSize}
          </div>
          <div className="text-xs text-gray-500">специалистов</div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-2 mb-4">
        <a
          href={`tel:${provider.contact.phone}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>{provider.contact.phone}</span>
        </a>

        <a
          href={`mailto:${provider.contact.email}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="truncate">{provider.contact.email}</span>
        </a>

        {provider.contact.website && (
          <a
            href={provider.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="truncate">Веб-сайт</span>
          </a>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="default" className="flex-1">
          Подробнее
        </Button>
        <Button variant="outline" size="icon">
          <Mail className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mountain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Геологические услуги
              </h1>
              <p className="text-gray-600">
                {providers.length} поставщиков геологических услуг в Казахстане
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по компаниям, услугам..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все регионы</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все услуги</option>
              {GEOLOGICAL_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                leftIcon={<Grid3X3 className="w-4 h-4" />}
              >
                Список
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                leftIcon={<MapIcon className="w-4 h-4" />}
              >
                Карта
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">По рейтингу</option>
              <option value="experience">По опыту</option>
              <option value="projects">По количеству проектов</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers.map(renderProviderCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4">
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Карта поставщиков услуг</p>
                <p className="text-sm text-gray-500 mt-2">
                  Интерактивная карта будет добавлена в следующем обновлении
                </p>
              </div>
            </div>
          </div>
        )}

        {providers.length === 0 && (
          <div className="text-center py-12">
            <Mountain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Поставщики не найдены
            </h3>
            <p className="text-gray-500">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
