import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Deposit = Database['public']['Tables']['kazakhstan_deposits']['Row'];

export interface SearchFilters {
  query?: string;
  type?: string[];
  mineral?: string[];
  region?: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  verified?: boolean;
  featured?: boolean;
  status?: string[];
  sortBy?: 'price' | 'area' | 'created_at' | 'views' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  deposits: Deposit[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    types: { value: string; count: number }[];
    minerals: { value: string; count: number }[];
    regions: { value: string; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
  };
}

export class SearchService {
  private supabase = createClient();

  async search(filters: SearchFilters): Promise<SearchResult> {
    const {
      query,
      type,
      mineral,
      region,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      verified,
      featured,
      status = ['ACTIVE'],
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = filters;

    // Build base query
    let queryBuilder = this.supabase
      .from('kazakhstan_deposits')
      .select('*', { count: 'exact' });

    // Full-text search
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Type filter
    if (type && type.length > 0) {
      queryBuilder = queryBuilder.in('type', type);
    }

    // Mineral filter
    if (mineral && mineral.length > 0) {
      queryBuilder = queryBuilder.in('mineral', mineral);
    }

    // Region filter
    if (region && region.length > 0) {
      queryBuilder = queryBuilder.in('region', region);
    }

    // Price range filter
    if (priceMin !== undefined) {
      queryBuilder = queryBuilder.gte('price', priceMin);
    }
    if (priceMax !== undefined) {
      queryBuilder = queryBuilder.lte('price', priceMax);
    }

    // Area range filter
    if (areaMin !== undefined) {
      queryBuilder = queryBuilder.gte('area', areaMin);
    }
    if (areaMax !== undefined) {
      queryBuilder = queryBuilder.lte('area', areaMax);
    }

    // Boolean filters
    if (verified !== undefined) {
      queryBuilder = queryBuilder.eq('verified', verified);
    }
    if (featured !== undefined) {
      queryBuilder = queryBuilder.eq('featured', featured);
    }

    // Status filter
    if (status && status.length > 0) {
      queryBuilder = queryBuilder.in('status', status);
    }

    // Sorting
    if (sortBy === 'relevance' && query) {
      // For relevance sorting, we'd need to implement a scoring system
      // For now, we'll use created_at as a fallback
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else {
      queryBuilder = queryBuilder.order(sortBy, {
        ascending: sortOrder === 'asc',
      });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Get facets for filtering
    const facets = await this.getFacets(filters);

    return {
      deposits: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      facets,
    };
  }

  async getFacets(filters: SearchFilters) {
    // Get type counts
    const { data: types } = await this.supabase
      .from('kazakhstan_deposits')
      .select('type')
      .in('status', ['ACTIVE']);

    const typeCounts = this.countValues(types || [], 'type');

    // Get mineral counts
    const { data: minerals } = await this.supabase
      .from('kazakhstan_deposits')
      .select('mineral')
      .in('status', ['ACTIVE']);

    const mineralCounts = this.countValues(minerals || [], 'mineral');

    // Get region counts
    const { data: regions } = await this.supabase
      .from('kazakhstan_deposits')
      .select('region')
      .in('status', ['ACTIVE']);

    const regionCounts = this.countValues(regions || [], 'region');

    // Get price ranges
    const priceRanges = [
      { min: 0, max: 1000000000, count: 0 }, // < 1B
      { min: 1000000000, max: 10000000000, count: 0 }, // 1B - 10B
      { min: 10000000000, max: 50000000000, count: 0 }, // 10B - 50B
      { min: 50000000000, max: Number.MAX_SAFE_INTEGER, count: 0 }, // > 50B
    ];

    return {
      types: typeCounts,
      minerals: mineralCounts,
      regions: regionCounts,
      priceRanges,
    };
  }

  private countValues(
    data: any[],
    field: string
  ): { value: string; count: number }[] {
    const counts: Record<string, number> = {};

    data.forEach((item) => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const { data } = await this.supabase
      .from('kazakhstan_deposits')
      .select('title')
      .ilike('title', `%${query}%`)
      .limit(5);

    return data?.map((item: any) => item.title) || [];
  }

  async saveSearch(userId: string, filters: SearchFilters, name?: string) {
    const { error } = await (this.supabase as any)
      .from('saved_searches')
      .insert({
        user_id: userId,
        name: name || `Search ${new Date().toLocaleDateString()}`,
        filters: filters as any,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async getSavedSearches(userId: string) {
    const { data, error } = await (this.supabase as any)
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteSavedSearch(searchId: string, userId: string) {
    const { error } = await (this.supabase as any)
      .from('saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const searchService = new SearchService();
