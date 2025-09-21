'use client';

import { useState, useEffect } from 'react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import Image from 'next/image';
import {
  Truck,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Clock,
  Calendar,
  Filter,
  Search,
  Grid3X3,
  List,
  ArrowRight,
  Shield,
  Wrench,
  Fuel,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Card, CardBadge } from '@/components/ui/card-new';
import { Button } from '@/components/ui/button';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  year: number;
  condition: 'excellent' | 'good' | 'fair';
  description: string;
  specifications: {
    power?: string;
    capacity?: string;
    weight?: string;
    dimensions?: string;
    fuel?: string;
    operatingHours?: number;
  };
  images: string[];
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: 'KZT' | 'USD';
  availability: 'available' | 'rented' | 'maintenance';
  location: {
    city: string;
    region: string;
    coordinates: [number, number];
  };
  owner: {
    id: string;
    name: string;
    type: 'company' | 'individual';
    rating: number;
    reviewCount: number;
    verified: boolean;
    contact: {
      phone: string;
      email: string;
      website?: string;
    };
  };
  services: string[];
  certified: boolean;
}

const EQUIPMENT_CATEGORIES = [
  'Буровое оборудование',
  'Экскаваторы',
  'Самосвалы',
  'Дробильно-сортировочные комплексы',
  'Бульдозеры',
  'Погрузчики',
  'Транспортная техника',
  'Лабораторное оборудование',
  'Генераторы и компрессоры',
  'Насосное оборудование',
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

const equipmentData: EquipmentItem[] = [
  {
    id: '1',
    name: 'Буровая установка Atlas Copco ROC D7',
    category: 'Буровое оборудование',
    subcategory: 'Буровые установки',
    brand: 'Atlas Copco',
    model: 'ROC D7',
    year: 2019,
    condition: 'excellent',
    description:
      'Высокопроизводительная буровая установка для открытых горных работ. Оснащена современной системой управления и GPS навигацией.',
    specifications: {
      power: '350 кВт',
      capacity: 'диаметр бурения до 152 мм',
      weight: '45 тонн',
      fuel: 'дизель',
      operatingHours: 2840,
    },
    images: [
      'https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 180000,
    weeklyRate: 1200000,
    monthlyRate: 4500000,
    currency: 'KZT',
    availability: 'available',
    location: {
      city: 'Караганда',
      region: 'Карагандинская область',
      coordinates: [73.1526, 49.8047],
    },
    owner: {
      id: 'owner1',
      name: 'ТехРент Казахстан',
      type: 'company',
      rating: 4.7,
      reviewCount: 23,
      verified: true,
      contact: {
        phone: '+7 721 456 7890',
        email: 'rent@techrent.kz',
        website: 'https://techrent.kz',
      },
    },
    services: ['Доставка', 'Техобслуживание', 'Оператор'],
    certified: true,
  },
  {
    id: '2',
    name: 'Экскаватор Caterpillar 336',
    category: 'Экскаваторы',
    subcategory: 'Гусеничные экскаваторы',
    brand: 'Caterpillar',
    model: '336',
    year: 2020,
    condition: 'excellent',
    description:
      'Мощный гусеничный экскаватор для тяжелых горных работ. Надежность и производительность Caterpillar.',
    specifications: {
      power: '268 кВт',
      capacity: 'ковш 2.2 м³',
      weight: '36 тонн',
      fuel: 'дизель',
      operatingHours: 1850,
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 150000,
    weeklyRate: 1000000,
    monthlyRate: 3800000,
    currency: 'KZT',
    availability: 'available',
    location: {
      city: 'Алматы',
      region: 'Алматинская область',
      coordinates: [76.9129, 43.2567],
    },
    owner: {
      id: 'owner2',
      name: 'Горная Техника Ко',
      type: 'company',
      rating: 4.8,
      reviewCount: 31,
      verified: true,
      contact: {
        phone: '+7 727 345 6789',
        email: 'info@mining-tech.kz',
        website: 'https://mining-tech.kz',
      },
    },
    services: ['Доставка', 'Техобслуживание'],
    certified: true,
  },
  {
    id: '3',
    name: 'Самосвал BelAZ 75131',
    category: 'Самосвалы',
    subcategory: 'Карьерные самосвалы',
    brand: 'BelAZ',
    model: '75131',
    year: 2018,
    condition: 'good',
    description:
      'Карьерный самосвал грузоподъемностью 130 тонн. Идеален для транспортировки горной массы на большие расстояния.',
    specifications: {
      power: '1800 кВт',
      capacity: 'грузоподъемность 130 тонн',
      weight: '75 тонн',
      fuel: 'дизель',
      operatingHours: 4200,
    },
    images: [
      'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 200000,
    weeklyRate: 1350000,
    monthlyRate: 5200000,
    currency: 'KZT',
    availability: 'available',
    location: {
      city: 'Костанай',
      region: 'Костанайская область',
      coordinates: [63.6353, 53.2138],
    },
    owner: {
      id: 'owner3',
      name: 'КазТрансХэви',
      type: 'company',
      rating: 4.6,
      reviewCount: 18,
      verified: true,
      contact: {
        phone: '+7 714 567 8901',
        email: 'heavy@kaztrans.kz',
      },
    },
    services: ['Доставка', 'Оператор'],
    certified: false,
  },
  {
    id: '4',
    name: 'Дробильная установка Metso NP1213',
    category: 'Дробильно-сортировочные комплексы',
    subcategory: 'Конусные дробилки',
    brand: 'Metso',
    model: 'NP1213',
    year: 2021,
    condition: 'excellent',
    description:
      'Мобильная конусная дробилка для производства щебня и обогащения руды. Высокая производительность до 400 т/ч.',
    specifications: {
      power: '315 кВт',
      capacity: 'производительность до 400 т/ч',
      weight: '42 тонны',
      fuel: 'электричество',
      operatingHours: 980,
    },
    images: [
      'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 220000,
    weeklyRate: 1500000,
    monthlyRate: 5800000,
    currency: 'KZT',
    availability: 'rented',
    location: {
      city: 'Шымкент',
      region: 'Туркестанская область',
      coordinates: [69.5992, 42.3417],
    },
    owner: {
      id: 'owner4',
      name: 'СпецТехника Юг',
      type: 'company',
      rating: 4.9,
      reviewCount: 27,
      verified: true,
      contact: {
        phone: '+7 725 678 9012',
        email: 'south@spectech.kz',
        website: 'https://spectech-south.kz',
      },
    },
    services: ['Доставка', 'Монтаж', 'Техобслуживание'],
    certified: true,
  },
  {
    id: '5',
    name: 'Бульдозер Komatsu D375A',
    category: 'Бульдозеры',
    subcategory: 'Гусеничные бульдозеры',
    brand: 'Komatsu',
    model: 'D375A',
    year: 2017,
    condition: 'good',
    description:
      'Тяжелый гусеничный бульдозер для планировки и перемещения больших объемов грунта в карьерах.',
    specifications: {
      power: '410 кВт',
      capacity: 'отвал 7.4 м³',
      weight: '50 тонн',
      fuel: 'дизель',
      operatingHours: 5100,
    },
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 160000,
    weeklyRate: 1080000,
    monthlyRate: 4100000,
    currency: 'KZT',
    availability: 'available',
    location: {
      city: 'Павлодар',
      region: 'Павлодарская область',
      coordinates: [76.9574, 52.3038],
    },
    owner: {
      id: 'owner5',
      name: 'Павлодар-Техмаш',
      type: 'company',
      rating: 4.5,
      reviewCount: 14,
      verified: false,
      contact: {
        phone: '+7 718 789 0123',
        email: 'info@pavlodar-tech.kz',
      },
    },
    services: ['Доставка', 'Оператор'],
    certified: true,
  },
  {
    id: '6',
    name: 'Лабораторная мельница Retsch PM100',
    category: 'Лабораторное оборудование',
    subcategory: 'Измельчительное оборудование',
    brand: 'Retsch',
    model: 'PM100',
    year: 2022,
    condition: 'excellent',
    description:
      'Планетарная шаровая мельница для тонкого измельчения образцов руды и минералов в лабораторных условиях.',
    specifications: {
      power: '1.5 кВт',
      capacity: 'объем помола до 220 мл',
      weight: '85 кг',
      fuel: 'электричество',
      operatingHours: 340,
    },
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&auto=format&q=80',
    ],
    dailyRate: 12000,
    weeklyRate: 75000,
    monthlyRate: 280000,
    currency: 'KZT',
    availability: 'available',
    location: {
      city: 'Нур-Султан',
      region: 'Акмолинская область',
      coordinates: [71.4704, 51.1694],
    },
    owner: {
      id: 'owner6',
      name: 'КазЛаб Оборудование',
      type: 'company',
      rating: 4.8,
      reviewCount: 9,
      verified: true,
      contact: {
        phone: '+7 717 890 1234',
        email: 'lab@kazlab.kz',
        website: 'https://kazlab.kz',
      },
    },
    services: ['Доставка', 'Обучение персонала', 'Калибровка'],
    certified: true,
  },
];

export default function EquipmentRentalPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(equipmentData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  // Filter and sort equipment
  useEffect(() => {
    let filtered = [...equipmentData];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.owner.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(
        (item) => item.location.region === selectedRegion
      );
    }

    // Availability filter
    if (selectedAvailability !== 'all') {
      filtered = filtered.filter(
        (item) => item.availability === selectedAvailability
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (item) =>
        item.dailyRate >= priceRange[0] && item.dailyRate <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'price':
        filtered.sort((a, b) => a.dailyRate - b.dailyRate);
        break;
      case 'rating':
        filtered.sort((a, b) => b.owner.rating - a.owner.rating);
        break;
      case 'year':
        filtered.sort((a, b) => b.year - a.year);
        break;
      default:
        break;
    }

    setEquipment(filtered);
  }, [
    searchQuery,
    selectedCategory,
    selectedRegion,
    selectedAvailability,
    sortBy,
    priceRange,
  ]);

  const formatPrice = (price: number, currency: string) => {
    return (
      new Intl.NumberFormat('ru-KZ').format(price) +
      (currency === 'KZT' ? ' ₸' : ' $')
    );
  };

  const getAvailabilityStatus = (availability: string) => {
    switch (availability) {
      case 'available':
        return { label: 'Доступно', color: 'green', icon: CheckCircle };
      case 'rented':
        return { label: 'Арендовано', color: 'red', icon: AlertCircle };
      case 'maintenance':
        return { label: 'Обслуживание', color: 'yellow', icon: Wrench };
      default:
        return { label: 'Неизвестно', color: 'gray', icon: AlertCircle };
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'Отличное';
      case 'good':
        return 'Хорошее';
      case 'fair':
        return 'Удовлетворительное';
      default:
        return condition;
    }
  };

  const renderEquipmentCard = (item: EquipmentItem) => {
    const availability = getAvailabilityStatus(item.availability);
    const AvailabilityIcon = availability.icon;

    return (
      <Card
        key={item.id}
        variant="elevated"
        className="hover:shadow-xl transition-all duration-300"
      >
        {/* Equipment Image */}
        <div className="relative h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Truck className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Availability Badge */}
          <div
            className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              availability.color === 'green'
                ? 'bg-blue-100 text-blue-800'
                : availability.color === 'red'
                  ? 'bg-red-100 text-red-800'
                  : availability.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            <AvailabilityIcon className="w-3 h-3" />
            {availability.label}
          </div>
        </div>

        {/* Equipment Info */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600">
                {item.brand} {item.model} • {item.year} г.
              </p>
            </div>
            {item.certified && (
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{item.location.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Состояние: {getConditionLabel(item.condition)}</span>
            </div>
          </div>

          <CardBadge variant="info" className="text-xs mb-3">
            {item.category}
          </CardBadge>
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
          {item.specifications.power && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{item.specifications.power}</span>
            </div>
          )}
          {item.specifications.capacity && (
            <div className="flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              <span>{item.specifications.capacity}</span>
            </div>
          )}
          {item.specifications.operatingHours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{item.specifications.operatingHours} м/ч</span>
            </div>
          )}
          {item.specifications.fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="w-3 h-3" />
              <span>{item.specifications.fuel}</span>
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="flex items-center gap-3 mb-4 p-3 border rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.owner.name}</span>
              {item.owner.verified && (
                <Shield className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{item.owner.rating}</span>
              <span>({item.owner.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1 mb-4">
          {item.services.slice(0, 3).map((service) => (
            <CardBadge key={service} variant="default" className="text-xs">
              {service}
            </CardBadge>
          ))}
          {item.services.length > 3 && (
            <CardBadge variant="default" className="text-xs">
              +{item.services.length - 3}
            </CardBadge>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatPrice(item.dailyRate, item.currency)}
            </div>
            <div className="text-sm text-blue-600">за сутки</div>
            <div className="text-xs text-gray-600 mt-1">
              Неделя: {formatPrice(item.weeklyRate, item.currency)} • Месяц:{' '}
              {formatPrice(item.monthlyRate, item.currency)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            disabled={item.availability !== 'available'}
          >
            {item.availability === 'available' ? 'Арендовать' : 'Недоступно'}
          </Button>
          <Button variant="outline" size="icon">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Аренда оборудования
              </h1>
              <p className="text-gray-600">
                {equipment.length} единиц техники для горнодобывающей отрасли
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по технике, брендам..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

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
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="available">Доступно</option>
              <option value="rented">Арендовано</option>
              <option value="maintenance">На обслуживании</option>
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
                Сетка
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                leftIcon={<List className="w-4 h-4" />}
              >
                Список
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price">По цене</option>
              <option value="rating">По рейтингу</option>
              <option value="year">По году выпуска</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {equipment.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Техника не найдена
            </h3>
            <p className="text-gray-500">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {equipment.map(renderEquipmentCard)}
          </div>
        )}
      </div>
    </div>
  );
}
