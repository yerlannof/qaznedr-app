import { Client } from '@elastic/elasticsearch';
import { SearchFilters, SearchResult } from './search-service';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

type Deposit = Database['public']['Tables']['kazakhstan_deposits']['Row'];

// Elasticsearch configuration
const ELASTICSEARCH_CONFIG = {
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH
    ? {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || '',
      }
    : undefined,
  tls:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false, // For self-signed certificates
        }
      : undefined,
};

// Index configuration for Kazakhstan deposits
const DEPOSITS_INDEX = 'kazakhstan_deposits';
const DEPOSITS_MAPPING = {
  properties: {
    id: { type: 'keyword' },
    title: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' },
        suggest: { type: 'completion' },
      },
    },
    description: {
      type: 'text',
      analyzer: 'standard',
    },
    type: { type: 'keyword' },
    mineral: { type: 'keyword' },
    region: { type: 'keyword' },
    price: { type: 'long' },
    area: { type: 'float' },
    coordinates: { type: 'geo_point' },
    status: { type: 'keyword' },
    verified: { type: 'boolean' },
    featured: { type: 'boolean' },
    views: { type: 'integer' },
    seller_id: { type: 'keyword' },
    created_at: { type: 'date' },
    updated_at: { type: 'date' },

    // Mining-specific fields
    license_number: { type: 'keyword' },
    license_expiry: { type: 'date' },
    license_subtype: { type: 'keyword' },

    // Exploration-specific fields
    exploration_stage: { type: 'keyword' },
    exploration_period: { type: 'keyword' },
    exploration_budget: { type: 'long' },

    // Mineral occurrence fields
    discovery_date: { type: 'date' },
    geological_confidence: { type: 'keyword' },
    estimated_reserves: { type: 'text' },

    // Search optimization fields
    search_keywords: { type: 'text', analyzer: 'keyword' },
    boost_score: { type: 'float' },

    // Full-text search field combining multiple fields
    search_text: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        english: { type: 'text', analyzer: 'english' },
        russian: { type: 'text', analyzer: 'russian' },
        kazakh: { type: 'text', analyzer: 'standard' },
      },
    },
  },
};

export class ElasticsearchService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client(ELASTICSEARCH_CONFIG);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
      this.isConnected = true;
      console.log('✅ Elasticsearch connected successfully');

      // Ensure index exists
      await this.ensureIndex();
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error);
      this.isConnected = false;
    }
  }

  private async ensureIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: DEPOSITS_INDEX,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: DEPOSITS_INDEX,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  kazakh_analyzer: {
                    type: 'standard',
                    stopwords: ['_none_'],
                  },
                  russian_analyzer: {
                    type: 'standard',
                    stopwords: '_russian_',
                  },
                },
              },
            },
            mappings: DEPOSITS_MAPPING,
          },
        });

        console.log('✅ Elasticsearch index created:', DEPOSITS_INDEX);
      }
    } catch (error) {
      console.error('❌ Failed to create Elasticsearch index:', error);
    }
  }

  /**
   * Sync a single deposit to Elasticsearch
   */
  async syncDeposit(deposit: Deposit): Promise<void> {
    if (!this.isConnected) {
      console.warn('Elasticsearch not connected, skipping sync');
      return;
    }

    try {
      // Transform deposit for Elasticsearch
      const esDoc = await this.transformDepositForES(deposit);

      await this.client.index({
        index: DEPOSITS_INDEX,
        id: deposit.id,
        body: esDoc,
        refresh: 'wait_for', // Ensure immediate availability
      });

      console.log(`✅ Synced deposit ${deposit.id} to Elasticsearch`);
    } catch (error) {
      console.error(`❌ Failed to sync deposit ${deposit.id}:`, error);
    }
  }

  /**
   * Bulk sync multiple deposits
   */
  async bulkSyncDeposits(deposits: Deposit[]): Promise<void> {
    if (!this.isConnected || deposits.length === 0) {
      return;
    }

    try {
      const body = [];

      for (const deposit of deposits) {
        // Add index operation
        body.push({
          index: {
            _index: DEPOSITS_INDEX,
            _id: deposit.id,
          },
        });

        // Add document
        body.push(await this.transformDepositForES(deposit));
      }

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for',
      });

      if (response.errors) {
        console.error('❌ Bulk sync had errors:', response.items);
      } else {
        console.log(
          `✅ Bulk synced ${deposits.length} deposits to Elasticsearch`
        );
      }
    } catch (error) {
      console.error('❌ Bulk sync failed:', error);
    }
  }

  /**
   * Delete a deposit from Elasticsearch
   */
  async deleteDeposit(depositId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.delete({
        index: DEPOSITS_INDEX,
        id: depositId,
        refresh: 'wait_for',
      });

      console.log(`✅ Deleted deposit ${depositId} from Elasticsearch`);
    } catch (error) {
      if (error.statusCode !== 404) {
        console.error(`❌ Failed to delete deposit ${depositId}:`, error);
      }
    }
  }

  /**
   * Advanced search using Elasticsearch
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    if (!this.isConnected) {
      throw new Error('Elasticsearch not available');
    }

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

    // Build Elasticsearch query
    const esQuery: any = {
      bool: {
        must: [],
        filter: [],
      },
    };

    // Full-text search with multi-language support
    if (query) {
      esQuery.bool.must.push({
        multi_match: {
          query,
          fields: [
            'title^3',
            'search_text^2',
            'search_text.english^2',
            'search_text.russian^2',
            'search_text.kazakh^2',
            'description',
            'search_keywords^1.5',
          ],
          fuzziness: 'AUTO',
          operator: 'or',
        },
      });
    } else {
      esQuery.bool.must.push({ match_all: {} });
    }

    // Filters
    if (status && status.length > 0) {
      esQuery.bool.filter.push({ terms: { status } });
    }

    if (type && type.length > 0) {
      esQuery.bool.filter.push({ terms: { type } });
    }

    if (mineral && mineral.length > 0) {
      esQuery.bool.filter.push({ terms: { mineral } });
    }

    if (region && region.length > 0) {
      esQuery.bool.filter.push({ terms: { region } });
    }

    if (verified !== undefined) {
      esQuery.bool.filter.push({ term: { verified } });
    }

    if (featured !== undefined) {
      esQuery.bool.filter.push({ term: { featured } });
    }

    // Range filters
    if (priceMin !== undefined || priceMax !== undefined) {
      const priceRange: any = {};
      if (priceMin !== undefined) priceRange.gte = priceMin;
      if (priceMax !== undefined) priceRange.lte = priceMax;
      esQuery.bool.filter.push({ range: { price: priceRange } });
    }

    if (areaMin !== undefined || areaMax !== undefined) {
      const areaRange: any = {};
      if (areaMin !== undefined) areaRange.gte = areaMin;
      if (areaMax !== undefined) areaRange.lte = areaMax;
      esQuery.bool.filter.push({ range: { area: areaRange } });
    }

    // Sorting
    const sort: any[] = [];

    if (sortBy === 'relevance' && query) {
      // Use Elasticsearch relevance scoring with boost
      sort.push('_score');
      sort.push({ boost_score: { order: 'desc' } });
    } else {
      const sortField = sortBy === 'created_at' ? 'created_at' : sortBy;
      sort.push({ [sortField]: { order: sortOrder } });
    }

    // Always add a secondary sort for consistency
    sort.push({ created_at: { order: 'desc' } });

    // Pagination
    const from = (page - 1) * limit;

    // Execute search with aggregations for facets
    const searchParams = {
      index: DEPOSITS_INDEX,
      body: {
        query: esQuery,
        sort,
        from,
        size: limit,
        aggs: {
          types: {
            terms: { field: 'type', size: 20 },
          },
          minerals: {
            terms: { field: 'mineral', size: 50 },
          },
          regions: {
            terms: { field: 'region', size: 20 },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 1000000000, key: '< 1B' },
                { from: 1000000000, to: 10000000000, key: '1B - 10B' },
                { from: 10000000000, to: 50000000000, key: '10B - 50B' },
                { from: 50000000000, key: '> 50B' },
              ],
            },
          },
        },
      },
    };

    try {
      const response = await this.client.search(searchParams);

      // Transform results
      const deposits = response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

      // Transform aggregations to facets
      const aggs = response.body.aggregations;
      const facets = {
        types: aggs.types.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
        })),
        minerals: aggs.minerals.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
        })),
        regions: aggs.regions.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
        })),
        priceRanges: aggs.price_ranges.buckets.map((bucket: any) => ({
          min: bucket.from || 0,
          max: bucket.to || Number.MAX_SAFE_INTEGER,
          count: bucket.doc_count,
        })),
      };

      return {
        deposits,
        total: response.body.hits.total.value,
        page,
        totalPages: Math.ceil(response.body.hits.total.value / limit),
        facets,
      };
    } catch (error) {
      console.error('❌ Elasticsearch search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions with autocomplete
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!this.isConnected || !query || query.length < 2) {
      return [];
    }

    try {
      const response = await this.client.search({
        index: DEPOSITS_INDEX,
        body: {
          suggest: {
            title_suggest: {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: 10,
              },
            },
          },
          _source: false,
        },
      });

      const suggestions = response.body.suggest.title_suggest[0].options.map(
        (option: any) => option.text
      );

      return suggestions;
    } catch (error) {
      console.error('❌ Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Transform deposit for Elasticsearch indexing
   */
  private async transformDepositForES(deposit: Deposit): Promise<any> {
    // Create searchable text by combining multiple fields
    const searchText = [
      deposit.title,
      deposit.description,
      deposit.region,
      deposit.mineral,
      deposit.type,
      deposit.license_number,
    ]
      .filter(Boolean)
      .join(' ');

    // Calculate boost score based on various factors
    const boostScore = this.calculateBoostScore(deposit);

    // Extract keywords for better search
    const keywords = this.extractKeywords(deposit);

    return {
      ...deposit,
      search_text: searchText,
      search_keywords: keywords.join(' '),
      boost_score: boostScore,
      coordinates:
        deposit.latitude && deposit.longitude
          ? {
              lat: deposit.latitude,
              lon: deposit.longitude,
            }
          : null,
    };
  }

  /**
   * Calculate boost score for search ranking
   */
  private calculateBoostScore(deposit: Deposit): number {
    let score = 1.0;

    // Boost verified deposits
    if (deposit.verified) score += 0.3;

    // Boost featured deposits
    if (deposit.featured) score += 0.5;

    // Boost based on views (if available)
    if (deposit.views) {
      score += Math.min(deposit.views / 1000, 0.2);
    }

    // Boost recent deposits
    if (deposit.created_at) {
      const daysSinceCreation =
        (Date.now() - new Date(deposit.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) {
        score += 0.1;
      }
    }

    return Math.min(score, 2.0); // Cap at 2.0
  }

  /**
   * Extract search keywords from deposit
   */
  private extractKeywords(deposit: Deposit): string[] {
    const keywords = new Set<string>();

    // Add type-specific keywords
    if (deposit.type) {
      keywords.add(deposit.type.toLowerCase());
      if (deposit.type === 'MINING_LICENSE') {
        keywords.add('mining');
        keywords.add('license');
        keywords.add('extraction');
      } else if (deposit.type === 'EXPLORATION_LICENSE') {
        keywords.add('exploration');
        keywords.add('survey');
        keywords.add('geological');
      } else if (deposit.type === 'MINERAL_OCCURRENCE') {
        keywords.add('occurrence');
        keywords.add('deposit');
        keywords.add('discovery');
      }
    }

    // Add mineral keywords
    if (deposit.mineral) {
      keywords.add(deposit.mineral.toLowerCase());
    }

    // Add region keywords
    if (deposit.region) {
      keywords.add(deposit.region.toLowerCase());
    }

    return Array.from(keywords);
  }

  /**
   * Full reindex of all deposits from Supabase
   */
  async fullReindex(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Elasticsearch not connected');
    }

    console.log('🔄 Starting full reindex...');

    try {
      // Clear existing index
      await this.client.deleteByQuery({
        index: DEPOSITS_INDEX,
        body: {
          query: { match_all: {} },
        },
        refresh: true,
      });

      // Get all deposits from Supabase
      const supabase = createClient();
      const { data: deposits, error } = await supabase
        .from('kazakhstan_deposits')
        .select('*');

      if (error) {
        throw error;
      }

      if (deposits && deposits.length > 0) {
        // Bulk sync all deposits
        await this.bulkSyncDeposits(deposits);
        console.log(`✅ Full reindex completed: ${deposits.length} deposits`);
      } else {
        console.log('⚠️ No deposits found to index');
      }
    } catch (error) {
      console.error('❌ Full reindex failed:', error);
      throw error;
    }
  }

  /**
   * Health check for Elasticsearch
   */
  async healthCheck(): Promise<{
    connected: boolean;
    cluster: string;
    status: string;
    indexExists: boolean;
    documentCount: number;
  }> {
    try {
      const [healthResponse, indexExistsResponse] = await Promise.all([
        this.client.cluster.health(),
        this.client.indices.exists({ index: DEPOSITS_INDEX }),
      ]);

      let documentCount = 0;
      if (indexExistsResponse) {
        const countResponse = await this.client.count({
          index: DEPOSITS_INDEX,
        });
        documentCount = countResponse.body.count;
      }

      return {
        connected: true,
        cluster: healthResponse.body.cluster_name,
        status: healthResponse.body.status,
        indexExists: indexExistsResponse,
        documentCount,
      };
    } catch (error) {
      return {
        connected: false,
        cluster: 'unknown',
        status: 'error',
        indexExists: false,
        documentCount: 0,
      };
    }
  }

  /**
   * Close Elasticsearch connection
   */
  async close(): Promise<void> {
    await this.client.close();
    this.isConnected = false;
  }
}

export const elasticsearchService = new ElasticsearchService();
