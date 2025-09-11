import { KazakhstanDeposit, ApiResponse } from '@/lib/types/listing';
import { apiClient } from './client';

// API для работы с избранными
export const favoritesApi = {
  // Получить список избранного
  async getFavorites(): Promise<KazakhstanDeposit[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<
          Array<{
            id: string;
            createdAt: Date;
            deposit: KazakhstanDeposit;
          }>
        >
      >('/api/favorites');

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map((fav) => fav.deposit);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  },

  // Добавить в избранное
  async addToFavorites(depositId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      '/api/favorites',
      {
        depositId,
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to add to favorites');
    }
  },

  // Удалить из избранного
  async removeFromFavorites(depositId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      '/api/favorites',
      { depositId }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove from favorites');
    }
  },
};
