import { Client } from '@elastic/elasticsearch';
import { z } from 'zod';

// Search result schema
const searchResultSchema = z.object({
  id: z.string(),
  type: z.enum(['MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE']),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  region: z.string(),
  minerals: z.array(z.string()),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  area_hectares: z.number().optional(),
  reserves_tons: z.number().optional(),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  exploration_stage: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
  seller_id: z.string(),
  score: z.number().optional(),
  highlights: z.record(z.array(z.string())).optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

// Aggregation result
interface AggregationBucket {
  key: string;
  doc_count: number;
}

interface SearchAggregations {
  regions?: AggregationBucket[];
  minerals?: AggregationBucket[];
  types?: AggregationBucket[];
  price_ranges?: AggregationBucket[];
  area_ranges?: AggregationBucket[];
}

// Search parameters
export interface SearchParams {
  query?: string;
  filters?: {
    type?: string[];
    region?: string[];
    minerals?: string[];
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    licenseStatus?: string[];
    explorationStage?: string[];
  };
  sort?: {
    field: 'price' | 'area' | 'created_at' | 'reserves' | '_score';
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    size: number;
  };
  geoFilter?: {
    lat: number;
    lng: number;
    radius: string; // e.g., "50km"
  };
  includeAggregations?: boolean;
}

export class ElasticsearchClient {
  private client: Client;
  private indexName = 'kazakhstan_deposits';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_API_KEY
        ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Initialize Elasticsearch index with mappings
   */
  async initializeIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 2,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  kazakh_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'kazakh_stop', 'kazakh_stemmer'],
                  },
                  russian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
                  },
                },
                filter: {
                  kazakh_stop: {
                    type: 'stop',
                    stopwords: '_kazakh_',
                  },
                  kazakh_stemmer: {
                    type: 'stemmer',
                    language: 'kazakh',
                  },
                  russian_stop: {
                    type: 'stop',
                    stopwords: '_russian_',
                  },
                  russian_stemmer: {
                    type: 'stemmer',
                    language: 'russian',
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                title: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                    kazakh: { type: 'text', analyzer: 'kazakh_analyzer' },
                    russian: { type: 'text', analyzer: 'russian_analyzer' },
                  },
                },
                description: {
                  type: 'text',
                  fields: {
                    kazakh: { type: 'text', analyzer: 'kazakh_analyzer' },
                    russian: { type: 'text', analyzer: 'russian_analyzer' },
                  },
                },
                price: { type: 'float' },
                region: { type: 'keyword' },
                minerals: { type: 'keyword' },
                location: { type: 'geo_point' },
                area_hectares: { type: 'float' },
                reserves_tons: { type: 'float' },
                license_number: { type: 'keyword' },
                license_expiry: { type: 'date' },
                license_subtype: { type: 'keyword' },
                exploration_stage: { type: 'keyword' },
                exploration_budget: { type: 'float' },
                geological_confidence: { type: 'keyword' },
                status: { type: 'keyword' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' },
                seller_id: { type: 'keyword' },
                view_count: { type: 'integer' },
                favorite_count: { type: 'integer' },
                images: { type: 'keyword' },
                documents: { type: 'keyword' },
                accessibility_rating: { type: 'float' },
                environmental_status: { type: 'keyword' },
                suggest: {
                  type: 'completion',
                  analyzer: 'simple',
                  contexts: [
                    {
                      name: 'region',
                      type: 'category',
                    },
                    {
                      name: 'type',
                      type: 'category',
                    },
                  ],
                },
              },
            },
          },
        });

        console.log('Elasticsearch index created successfully');
      }
    } catch (error) {
      console.error('Error initializing Elasticsearch index:', error);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(document: any): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: document.id,
        body: {
          ...document,
          location: document.coordinates
            ? {
                lat: document.coordinates.lat,
                lon: document.coordinates.lng,
              }
            : undefined,
          suggest: {
            input: [document.title, ...document.minerals],
            contexts: {
              region: document.region,
              type: document.type,
            },
          },
        },
      });

      await this.client.indices.refresh({ index: this.indexName });
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: any[]): Promise<void> {
    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: this.indexName, _id: doc.id } },
        {
          ...doc,
          location: doc.coordinates
            ? {
                lat: doc.coordinates.lat,
                lon: doc.coordinates.lng,
              }
            : undefined,
          suggest: {
            input: [doc.title, ...doc.minerals],
            contexts: {
              region: doc.region,
              type: doc.type,
            },
          },
        },
      ]);

      const result = await this.client.bulk({ body });

      if (result.errors) {
        const errors = result.items.filter((item) => item.index?.error);
        console.error('Bulk indexing errors:', errors);
        throw new Error('Bulk indexing failed');
      }

      await this.client.indices.refresh({ index: this.indexName });
      console.log(`Successfully indexed ${documents.length} documents`);
    } catch (error) {
      console.error('Error bulk indexing documents:', error);
      throw error;
    }
  }

  /**
   * Advanced search with facets and filters
   */
  async search(params: SearchParams): Promise<{
    results: SearchResult[];
    total: number;
    aggregations?: SearchAggregations;
  }> {
    try {
      const {
        query = '',
        filters = {},
        sort = { field: '_score', order: 'desc' },
        pagination = { page: 1, size: 20 },
        geoFilter,
        includeAggregations = false,
      } = params;

      // Build query
      const must: any[] = [];
      const filter: any[] = [];

      // Full-text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: [
              'title^3',
              'title.kazakh^2',
              'title.russian^2',
              'description',
              'description.kazakh',
              'description.russian',
              'minerals^2',
              'region',
              'license_number',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        });
      }

      // Type filter
      if (filters.type?.length) {
        filter.push({ terms: { type: filters.type } });
      }

      // Region filter
      if (filters.region?.length) {
        filter.push({ terms: { region: filters.region } });
      }

      // Minerals filter
      if (filters.minerals?.length) {
        filter.push({ terms: { minerals: filters.minerals } });
      }

      // Price range filter
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        filter.push({
          range: {
            price: {
              ...(filters.priceMin !== undefined && { gte: filters.priceMin }),
              ...(filters.priceMax !== undefined && { lte: filters.priceMax }),
            },
          },
        });
      }

      // Area range filter
      if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
        filter.push({
          range: {
            area_hectares: {
              ...(filters.areaMin !== undefined && { gte: filters.areaMin }),
              ...(filters.areaMax !== undefined && { lte: filters.areaMax }),
            },
          },
        });
      }

      // License status filter
      if (filters.licenseStatus?.length) {
        filter.push({ terms: { status: filters.licenseStatus } });
      }

      // Exploration stage filter
      if (filters.explorationStage?.length) {
        filter.push({ terms: { exploration_stage: filters.explorationStage } });
      }

      // Geo-distance filter
      if (geoFilter) {
        filter.push({
          geo_distance: {
            distance: geoFilter.radius,
            location: {
              lat: geoFilter.lat,
              lon: geoFilter.lng,
            },
          },
        });
      }

      // Build aggregations
      const aggs = includeAggregations
        ? {
            regions: { terms: { field: 'region', size: 20 } },
            minerals: { terms: { field: 'minerals', size: 30 } },
            types: { terms: { field: 'type', size: 3 } },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { key: 'Under 10M', to: 10000000 },
                  { key: '10M-50M', from: 10000000, to: 50000000 },
                  { key: '50M-100M', from: 50000000, to: 100000000 },
                  { key: 'Over 100M', from: 100000000 },
                ],
              },
            },
            area_ranges: {
              range: {
                field: 'area_hectares',
                ranges: [
                  { key: 'Under 100', to: 100 },
                  { key: '100-500', from: 100, to: 500 },
                  { key: '500-1000', from: 500, to: 1000 },
                  { key: 'Over 1000', from: 1000 },
                ],
              },
            },
          }
        : undefined;

      // Sort configuration
      const sortConfig =
        sort.field === '_score'
          ? undefined
          : { [sort.field]: { order: sort.order } };

      // Execute search
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: must.length ? must : [{ match_all: {} }],
              filter,
            },
          },
          ...(sortConfig && { sort: [sortConfig, '_score'] }),
          from: (pagination.page - 1) * pagination.size,
          size: pagination.size,
          highlight: {
            fields: {
              title: { number_of_fragments: 1 },
              description: { number_of_fragments: 2 },
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
          },
          ...(aggs && { aggs }),
          track_total_hits: true,
        },
      });

      // Parse results
      const results: SearchResult[] = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
        coordinates: hit._source.location
          ? {
              lat: hit._source.location.lat,
              lng: hit._source.location.lon,
            }
          : undefined,
      }));

      // Parse aggregations
      const aggregations: SearchAggregations = {};
      if (response.aggregations) {
        if (response.aggregations.regions) {
          aggregations.regions = response.aggregations.regions.buckets;
        }
        if (response.aggregations.minerals) {
          aggregations.minerals = response.aggregations.minerals.buckets;
        }
        if (response.aggregations.types) {
          aggregations.types = response.aggregations.types.buckets;
        }
        if (response.aggregations.price_ranges) {
          aggregations.price_ranges =
            response.aggregations.price_ranges.buckets;
        }
        if (response.aggregations.area_ranges) {
          aggregations.area_ranges = response.aggregations.area_ranges.buckets;
        }
      }

      return {
        results,
        total: response.hits.total.value,
        aggregations,
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Autocomplete suggestions
   */
  async suggest(
    prefix: string,
    context?: { region?: string; type?: string }
  ): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            autocomplete: {
              prefix,
              completion: {
                field: 'suggest',
                size: 10,
                skip_duplicates: true,
                ...(context && {
                  contexts: {
                    ...(context.region && { region: context.region }),
                    ...(context.type && { type: context.type }),
                  },
                }),
              },
            },
          },
        },
      });

      return response.suggest.autocomplete[0].options.map(
        (option: any) => option.text
      );
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * More like this - find similar listings
   */
  async findSimilar(
    documentId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            more_like_this: {
              fields: ['title', 'description', 'minerals', 'region', 'type'],
              like: [
                {
                  _index: this.indexName,
                  _id: documentId,
                },
              ],
              min_term_freq: 1,
              max_query_terms: 12,
              min_doc_freq: 1,
            },
          },
          size: limit,
        },
      });

      return response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
        coordinates: hit._source.location
          ? {
              lat: hit._source.location.lat,
              lng: hit._source.location.lon,
            }
          : undefined,
      }));
    } catch (error) {
      console.error('Error finding similar documents:', error);
      return [];
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<any>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id,
        body: {
          doc: {
            ...updates,
            updated_at: new Date().toISOString(),
          },
        },
      });

      await this.client.indices.refresh({ index: this.indexName });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id,
      });

      await this.client.indices.refresh({ index: this.indexName });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(): Promise<{
    popularSearches: Array<{ term: string; count: number }>;
    searchVolume: Array<{ date: string; count: number }>;
    conversionRate: number;
  }> {
    try {
      // This would typically query a separate analytics index
      // For now, returning mock data structure
      return {
        popularSearches: [],
        searchVolume: [],
        conversionRate: 0,
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.client.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      console.error('Elasticsearch health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const elasticsearchClient = new ElasticsearchClient();
