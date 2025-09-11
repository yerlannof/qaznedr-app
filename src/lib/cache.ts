import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { prisma } from './prisma';
import type { ListingFilters, SearchParams } from './types/listing';

// Cache для получения списка объявлений
export const getListingsCache = unstable_cache(
  async (params: SearchParams) => {
    const {
      query,
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = params;

    const skip = (page - 1) * limit;

    // Строим фильтры
    const where: any = {
      status: 'ACTIVE', // показываем только активные объявления
    };

    if (filters.region?.length) where.region = { in: filters.region };
    if (filters.mineral?.length) where.mineral = { in: filters.mineral };
    if (filters.type?.length) where.type = { in: filters.type };
    if (filters.verified !== undefined) where.verified = filters.verified;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.priceMin || filters.priceMax) {
      where.price = {
        ...(filters.priceMin && { gte: filters.priceMin }),
        ...(filters.priceMax && { lte: filters.priceMax }),
      };
    }
    if (filters.areaMin || filters.areaMax) {
      where.area = {
        ...(filters.areaMin && { gte: filters.areaMin }),
        ...(filters.areaMax && { lte: filters.areaMax }),
      };
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Получаем данные с подсчетом общего количества
    const [deposits, total] = await Promise.all([
      prisma.kazakhstanDeposit.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              verified: true,
            },
          },
          _count: {
            select: {
              favorites: true,
              views_: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.kazakhstanDeposit.count({ where }),
    ]);

    // Преобразуем данные для клиента
    const formattedDeposits = deposits.map((deposit) => ({
      ...deposit,
      coordinates: JSON.parse(deposit.coordinates),
      images: JSON.parse(deposit.images),
      documents: JSON.parse(deposit.documents),
      favoritesCount: deposit._count.favorites,
      viewsCount: deposit._count.views_,
    }));

    return {
      deposits: formattedDeposits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
  ['listings'],
  { 
    revalidate: 3600, // 1 час
    tags: ['listings'] 
  }
);

// Cache для получения одного объявления
export const getListingByIdCache = unstable_cache(
  async (id: string) => {
    const deposit = await prisma.kazakhstanDeposit.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            verified: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views_: true,
          },
        },
      },
    });

    if (!deposit) return null;

    return {
      ...deposit,
      coordinates: JSON.parse(deposit.coordinates),
      images: JSON.parse(deposit.images),
      documents: JSON.parse(deposit.documents),
      favoritesCount: deposit._count.favorites,
      viewsCount: deposit._count.views_,
    };
  },
  ['listing-detail'],
  { 
    revalidate: 1800, // 30 минут
    tags: ['listing-detail'] 
  }
);

// Cache для статистики
export const getStatsCache = unstable_cache(
  async () => {
    const [
      total,
      verified,
      featured,
      active,
      regionStats,
      mineralStats,
    ] = await Promise.all([
      prisma.kazakhstanDeposit.count(),
      prisma.kazakhstanDeposit.count({ where: { verified: true } }),
      prisma.kazakhstanDeposit.count({ where: { featured: true } }),
      prisma.kazakhstanDeposit.count({ where: { status: 'ACTIVE' } }),
      prisma.kazakhstanDeposit.groupBy({
        by: ['region'],
        _count: true,
        _avg: { price: true },
        where: { status: 'ACTIVE' },
      }),
      prisma.kazakhstanDeposit.groupBy({
        by: ['mineral'],
        _count: true,
        _avg: { price: true, area: true },
        where: { status: 'ACTIVE' },
      }),
    ]);

    const totalValue = await prisma.kazakhstanDeposit.aggregate({
      _sum: { price: true },
      where: { status: 'ACTIVE', price: { not: null } },
    });

    return {
      total,
      verified,
      featured,
      active,
      regions: regionStats.length,
      minerals: mineralStats.length,
      totalValue: totalValue._sum.price || 0,
      regionStats: regionStats.map(stat => ({
        region: stat.region,
        count: stat._count,
        avgPrice: stat._avg.price || 0,
      })),
      mineralStats: mineralStats.map(stat => ({
        mineral: stat.mineral,
        count: stat._count,
        avgPrice: stat._avg.price || 0,
        avgArea: stat._avg.area || 0,
      })),
    };
  },
  ['stats'],
  { 
    revalidate: 7200, // 2 часа
    tags: ['stats'] 
  }
);

// Функции для инвалидации кеша
export function revalidateListings() {
  revalidateTag('listings');
}

export function revalidateListingDetail(id?: string) {
  revalidateTag('listing-detail');
  if (id) {
    revalidateTag(`listing-${id}`);
  }
}

export function revalidateStats() {
  revalidateTag('stats');
}

export function revalidateAll() {
  revalidateTag('listings');
  revalidateTag('listing-detail');
  revalidateTag('stats');
}

// Preload функции для prefetching
export function preloadListings(params: SearchParams) {
  void getListingsCache(params);
}

export function preloadListing(id: string) {
  void getListingByIdCache(id);
}

export function preloadStats() {
  void getStatsCache();
}