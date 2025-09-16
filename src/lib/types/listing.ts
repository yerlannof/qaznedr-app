// Основные типы для платформы недропользования Казахстана

export type MineralType =
  | 'Нефть'
  | 'Газ'
  | 'Золото'
  | 'Медь'
  | 'Уголь'
  | 'Уран'
  | 'Железо'
  | 'Свинец'
  | 'Цинк'
  | 'Хром';

export type RegionType =
  | 'Мангистауская'
  | 'Атырауская'
  | 'Карагандинская'
  | 'Восточно-Казахстанская'
  | 'Западно-Казахстанская'
  | 'Павлодарская'
  | 'Костанайская'
  | 'Акмолинская'
  | 'Жамбылская'
  | 'Кызылординская'
  | 'Актюбинская'
  | 'Алматинская'
  | 'Туркестанская'
  | 'Улытауская';

// Типы объявлений на платформе
export type ListingType =
  | 'MINING_LICENSE'
  | 'EXPLORATION_LICENSE'
  | 'MINERAL_OCCURRENCE';

// Подтипы лицензий
export type LicenseSubtype =
  | 'EXTRACTION_RIGHT' // Право на добычу
  | 'PROCESSING_RIGHT' // Право на переработку
  | 'TRANSPORTATION_RIGHT' // Право на транспортировку
  | 'COMBINED_RIGHT'; // Комбинированные права

export type ExplorationStage =
  | 'PRELIMINARY' // Предварительная разведка
  | 'DETAILED' // Детальная разведка
  | 'FEASIBILITY' // Технико-экономическое обоснование
  | 'ENVIRONMENTAL'; // Экологическая оценка
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PENDING' | 'DRAFT';

// Основной интерфейс объявления
export interface KazakhstanDeposit {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  mineral: MineralType;
  region: RegionType;
  city: string;
  area: number; // км²
  price: number | null; // в тенге
  coordinates: [number, number]; // [lat, lng]
  verified: boolean;
  featured: boolean;
  views: number;
  status: ListingStatus;
  images: string[];
  documents: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Специфичные поля для лицензий на добычу
  licenseSubtype?: LicenseSubtype;
  licenseNumber?: string;
  licenseExpiry?: Date;
  annualProductionLimit?: number;

  // Специфичные поля для лицензий на разведку
  explorationStage?: ExplorationStage;
  explorationPeriod?: {
    start: Date;
    end: Date;
  };
  explorationBudget?: number;

  // Специфичные поля для рудопроявлений
  discoveryDate?: Date;
  geologicalConfidence?: 'INFERRED' | 'INDICATED' | 'MEASURED';
  estimatedReserves?: number;
  accessibilityRating?: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'VERY_DIFFICULT';
}

// Фильтры для поиска месторождений
export interface ListingFilters {
  region?: RegionType[];
  mineral?: MineralType[];
  type?: ListingType[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  verified?: boolean;
  featured?: boolean;
  status?: ListingStatus[];
}

// Параметры поиска
export interface SearchParams {
  query?: string;
  filters?: ListingFilters;
  sortBy?: 'price' | 'area' | 'createdAt' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Результат поиска
export interface SearchResult {
  deposits: KazakhstanDeposit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Статистика по месторождениям
export interface DepositStats {
  total: number;
  verified: number;
  featured: number;
  active: number;
  regions: number;
  minerals: number;
  totalValue: number;
}

// Статистика по регионам
export interface RegionStats {
  region: RegionType;
  count: number;
  totalValue: number;
  avgPrice: number;
  topMineral: MineralType;
}

// Статистика по минералам
export interface MineralStats {
  mineral: MineralType;
  count: number;
  totalValue: number;
  avgPrice: number;
  avgArea: number;
}

// Пользователь платформы
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  company?: string;
  phone?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Избранные месторождения
export interface Favorite {
  id: string;
  userId: string;
  depositId: string;
  createdAt: Date;
}

// Просмотры месторождений
export interface View {
  id: string;
  depositId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Контакты и запросы
export interface ContactRequest {
  id: string;
  depositId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  phone?: string;
  email?: string;
  status: 'PENDING' | 'RESPONDED' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

// Документы месторождения
export interface Document {
  id: string;
  depositId: string;
  name: string;
  type:
    | 'LICENSE'
    | 'GEOLOGICAL_SURVEY'
    | 'ENVIRONMENTAL'
    | 'FINANCIAL'
    | 'LEGAL'
    | 'OTHER';
  url: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

// Геологические данные
export interface GeologicalData {
  id: string;
  depositId: string;
  reserves: number; // запасы в тоннах или баррелях
  grade?: number; // содержание полезного компонента в %
  depth: number; // глубина залегания в метрах
  thickness: number; // мощность пласта в метрах
  geology: string; // геологическое описание
  extractionMethod: 'OPEN_PIT' | 'UNDERGROUND' | 'IN_SITU' | 'OFFSHORE';
  recoveryRate?: number; // коэффициент извлечения в %
  updatedAt: Date;
}

// Инфраструктура месторождения
export interface Infrastructure {
  id: string;
  depositId: string;
  roads: boolean;
  railway: boolean;
  powerLine: boolean;
  pipeline: boolean;
  port: boolean;
  airport: boolean;
  waterSupply: boolean;
  housing: boolean;
  description?: string;
}

// Экономические показатели
export interface Economics {
  id: string;
  depositId: string;
  capex: number; // капитальные затраты в тенге
  opex: number; // операционные затраты в тенге/тонну
  paybackPeriod: number; // срок окупаемости в годах
  irr: number; // внутренняя норма доходности в %
  npv: number; // чистая приведенная стоимость в тенге
  productionStart?: Date;
  productionEnd?: Date;
  annualProduction: number; // годовая добыча
  calculatedAt: Date;
}

// Аукцион/тендер
export interface Auction {
  id: string;
  depositId: string;
  startPrice: number;
  currentPrice: number;
  minStep: number;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  winnerId?: string;
  participants: string[]; // userId[]
  createdAt: Date;
}

// Ставка на аукционе
export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  amount: number;
  timestamp: Date;
}

// Уведомления
export interface Notification {
  id: string;
  userId: string;
  type:
    | 'NEW_DEPOSIT'
    | 'PRICE_CHANGE'
    | 'AUCTION_START'
    | 'AUCTION_END'
    | 'MESSAGE'
    | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, unknown>; // дополнительные данные
  read: boolean;
  createdAt: Date;
}

// Настройки пользователя
export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  priceAlerts: boolean;
  newListingsAlerts: boolean;
  favoriteRegions: RegionType[];
  favoriteMinerals: MineralType[];
  priceRange: {
    min: number;
    max: number;
  };
  updatedAt: Date;
}

// API Response типы
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Константы
export const REGIONS: RegionType[] = [
  'Мангистауская',
  'Атырауская',
  'Карагандинская',
  'Восточно-Казахстанская',
  'Западно-Казахстанская',
  'Павлодарская',
  'Костанайская',
  'Акмолинская',
  'Жамбылская',
  'Кызылординская',
  'Актюбинская',
  'Алматинская',
  'Туркестанская',
  'Улытауская',
];

export const MINERALS: MineralType[] = [
  'Нефть',
  'Газ',
  'Золото',
  'Медь',
  'Уголь',
  'Уран',
  'Железо',
];

export const LISTING_TYPES: ListingType[] = [
  'MINING_LICENSE',
  'EXPLORATION_LICENSE',
  'MINERAL_OCCURRENCE',
];

export const LICENSE_SUBTYPES: LicenseSubtype[] = [
  'EXTRACTION_RIGHT',
  'PROCESSING_RIGHT',
  'TRANSPORTATION_RIGHT',
  'COMBINED_RIGHT',
];

export const EXPLORATION_STAGES: ExplorationStage[] = [
  'PRELIMINARY',
  'DETAILED',
  'FEASIBILITY',
  'ENVIRONMENTAL',
];

export const LISTING_STATUSES: ListingStatus[] = [
  'ACTIVE',
  'SOLD',
  'PENDING',
  'DRAFT',
];

// Вспомогательные типы для форм
export interface CreateDepositForm {
  title: string;
  description: string;
  type: ListingType;
  mineral: MineralType;
  region: RegionType;
  city: string;
  area: number;
  price?: number;
  coordinates: [number, number];
  images: File[];
  documents: File[];
}

export interface UpdateDepositForm extends Partial<CreateDepositForm> {
  id: string;
}

export interface SearchForm {
  query?: string;
  region?: RegionType;
  mineral?: MineralType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  verified?: boolean;
  featured?: boolean;
}

// Экспорт всех типов для удобства импорта
export type {
  KazakhstanDeposit as Deposit,
  ListingFilters as Filters,
  SearchParams as Search,
  SearchResult as Result,
};
