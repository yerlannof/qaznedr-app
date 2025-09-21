import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { elasticsearchService } from './elasticsearch-service';
import { dataSyncService } from '@/lib/sync/data-sync-service';
import { redisCacheService } from '@/lib/cache/redis-cache-service';
import {
  sentryMiningService,
  MiningErrorType,
  MiningMetric,
} from '@/lib/monitoring/sentry-service';
import { performanceMonitoring } from '@/lib/middleware/performance-monitoring';

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
  private useElasticsearch = process.env.ENABLE_ELASTICSEARCH === 'true';

  async search(filters: SearchFilters): Promise<SearchResult> {
    // Add search monitoring breadcrumb
    sentryMiningService.addMiningBreadcrumb(
      `Search operation started: ${filters.query || 'no query'}`,
      'search',
      {
        query: filters.query,
        sortBy: filters.sortBy,
        page: filters.page,
        limit: filters.limit,
      }
    );

    // Try to get cached results first
    const cachedResults =
      await redisCacheService.getCachedSearchResults(filters);
    if (cachedResults) {
      sentryMiningService.trackCacheOperation(
        'hit',
        `search:${filters.query || 'all'}`
      );

      // Track search performance
      sentryMiningService.trackMetric(
        MiningMetric.SEARCH_PERFORMED,
        1,
        {
          searchQuery: filters.query,
        },
        {
          cache_hit: 'true',
          search_type: 'cached',
          results_count: cachedResults.deposits.length.toString(),
        }
      );

      return cachedResults;
    }

    sentryMiningService.trackCacheOperation(
      'miss',
      `search:${filters.query || 'all'}`
    );

    let results: SearchResult;

    // Try Elasticsearch first if enabled
    if (this.useElasticsearch) {
      try {
        const esHealth = await elasticsearchService.healthCheck();
        if (esHealth.connected && esHealth.indexExists) {
          console.log('🔍 Using Elasticsearch for search');
          results = await performanceMonitoring.monitorSearchOperation(
            () => elasticsearchService.search(filters),
            filters.query || 'all',
            'elasticsearch'
          );
        } else {
          console.warn(
            '⚠️ Elasticsearch not available, falling back to Supabase'
          );
          results = await performanceMonitoring.monitorSearchOperation(
            () => this.searchWithSupabase(filters),
            filters.query || 'all',
            'supabase'
          );
        }
      } catch (error) {
        console.error(
          '❌ Elasticsearch search failed, falling back to Supabase:',
          error
        );

        // Capture Elasticsearch error
        sentryMiningService.captureError(
          error as Error,
          MiningErrorType.SEARCH_QUERY_FAILED,
          { searchQuery: filters.query },
          'warning'
        );

        results = await performanceMonitoring.monitorSearchOperation(
          () => this.searchWithSupabase(filters),
          filters.query || 'all',
          'supabase'
        );
      }
    } else {
      // Fallback to Supabase search
      console.log('🔍 Using Supabase for search');
      results = await performanceMonitoring.monitorSearchOperation(
        () => this.searchWithSupabase(filters),
        filters.query || 'all',
        'supabase'
      );
    }

    // Cache the results with monitoring
    await redisCacheService.cacheSearchResults(filters, results);
    sentryMiningService.trackCacheOperation(
      'set',
      `search:${filters.query || 'all'}`
    );

    // Track successful search
    sentryMiningService.trackMetric(
      MiningMetric.SEARCH_PERFORMED,
      1,
      {
        searchQuery: filters.query,
      },
      {
        cache_hit: 'false',
        search_type: this.useElasticsearch ? 'elasticsearch' : 'supabase',
        results_count: results.deposits.length.toString(),
        total_results: results.total.toString(),
      }
    );

    return results;
  }

  private async searchWithSupabase(
    filters: SearchFilters
  ): Promise<SearchResult> {
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

    // Execute query with monitoring
    const { data, error, count } =
      await performanceMonitoring.monitorDatabaseOperation(
        () => queryBuilder,
        'search_supabase_query',
        'kazakhstan_deposits'
      );

    if (error) {
      sentryMiningService.captureError(
        error,
        MiningErrorType.SEARCH_QUERY_FAILED,
        { searchQuery: query }
      );
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

    // Try to get cached suggestions first
    const cachedSuggestions =
      await redisCacheService.getCachedSuggestions(query);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }

    let suggestions: string[];

    // Try Elasticsearch first if enabled
    if (this.useElasticsearch) {
      try {
        const esHealth = await elasticsearchService.healthCheck();
        if (esHealth.connected && esHealth.indexExists) {
          suggestions = await elasticsearchService.getSuggestions(query);
        } else {
          // Fallback to Supabase
          const { data } = await this.supabase
            .from('kazakhstan_deposits')
            .select('title')
            .ilike('title', `%${query}%`)
            .limit(5);

          suggestions = data?.map((item: any) => item.title) || [];
        }
      } catch (error) {
        console.error(
          '❌ Elasticsearch suggestions failed, falling back to Supabase:',
          error
        );

        // Fallback to Supabase
        const { data } = await this.supabase
          .from('kazakhstan_deposits')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(5);

        suggestions = data?.map((item: any) => item.title) || [];
      }
    } else {
      // Fallback to Supabase
      const { data } = await this.supabase
        .from('kazakhstan_deposits')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(5);

      suggestions = data?.map((item: any) => item.title) || [];
    }

    // Cache the suggestions
    await redisCacheService.cacheSuggestions(query, suggestions);

    return suggestions;
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
