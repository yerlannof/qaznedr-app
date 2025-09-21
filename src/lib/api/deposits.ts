import {
  KazakhstanDeposit,
  SearchParams,
  SearchResult,
  ApiResponse,
} from '@/lib/types/listing';
import { apiClient } from './client';

// Специализированные функции для работы с месторождениями
export const depositApi = {
  // Поиск месторождений с фильтрацией
  async search(params: SearchParams): Promise<SearchResult> {
    const queryParams: Record<string, string> = {};

    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.query) queryParams.query = params.query;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    // Фильтры
    if (params.filters?.region) {
      queryParams.region = Array.isArray(params.filters.region)
        ? params.filters.region.join(',')
        : params.filters.region;
    }
    if (params.filters?.mineral) {
      queryParams.mineral = Array.isArray(params.filters.mineral)
        ? params.filters.mineral.join(',')
        : params.filters.mineral;
    }
    if (params.filters?.type) {
      queryParams.type = Array.isArray(params.filters.type)
        ? params.filters.type.join(',')
        : params.filters.type;
    }
    if (params.filters?.verified !== undefined) {
      queryParams.verified = params.filters.verified.toString();
    }
    if (params.filters?.featured !== undefined) {
      queryParams.featured = params.filters.featured.toString();
    }
    if (params.filters?.priceMin)
      queryParams.priceMin = params.filters.priceMin.toString();
    if (params.filters?.priceMax)
      queryParams.priceMax = params.filters.priceMax.toString();
    if (params.filters?.areaMin)
      queryParams.areaMin = params.filters.areaMin.toString();
    if (params.filters?.areaMax)
      queryParams.areaMax = params.filters.areaMax.toString();

    const response = await apiClient.get<
      ApiResponse<{
        deposits: KazakhstanDeposit[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>
    >('/api/listings', { params: queryParams });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch deposits');
    }

    return {
      deposits: response.data.deposits,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      totalPages: response.data.pagination.totalPages,
    };
  },

  // Получить конкретное месторождение по ID
  async getById(id: string): Promise<KazakhstanDeposit | null> {
    try {
      const response = await apiClient.get<ApiResponse<KazakhstanDeposit>>(
        `/api/listings/${id}`
      );

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Создать новое месторождение
  async create(
    deposit: Partial<KazakhstanDeposit>
  ): Promise<KazakhstanDeposit> {
    const response = await apiClient.post<ApiResponse<KazakhstanDeposit>>(
      '/api/listings',
      deposit
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create deposit');
    }

    return response.data;
  },

  // Обновить месторождение
  async update(
    id: string,
    deposit: Partial<KazakhstanDeposit>
  ): Promise<KazakhstanDeposit> {
    const response = await apiClient.put<ApiResponse<KazakhstanDeposit>>(
      `/api/listings/${id}`,
      deposit
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update deposit');
    }

    return response.data;
  },

  // Удалить месторождение
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/listings/${id}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete deposit');
    }
  },

  // Получить объявления текущего пользователя
  async getMyListings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SearchResult> {
    const queryParams: Record<string, string> = {};

    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.status) queryParams.status = params.status;

    const response = await apiClient.get<
      ApiResponse<{
        deposits: KazakhstanDeposit[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>
    >('/api/my-listings', { params: queryParams });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user listings');
    }

    return {
      deposits: response.data.deposits,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      totalPages: response.data.pagination.totalPages,
    };
  },
};
