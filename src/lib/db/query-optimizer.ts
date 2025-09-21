import { createClient } from '@/lib/supabase/server';

// Query optimization patterns
export class QueryOptimizer {
  // Use database indexes efficiently
  static buildOptimizedQuery(tableName: string, filters: any) {
    const supabase = createClient();
    let query = supabase.from(tableName);

    // Use indexed columns first for better performance
    const indexedColumns = ['id', 'type', 'status', 'created_at', 'user_id'];

    // Apply indexed filters first
    Object.keys(filters).forEach((key) => {
      if (indexedColumns.includes(key) && filters[key] !== undefined) {
        query = query.eq(key, filters[key]);
      }
    });

    return query;
  }

  // Select only needed columns
  static selectOptimized(columns: string[]) {
    return columns.join(',');
  }

  // Batch operations for better performance
  static async batchInsert<T>(
    tableName: string,
    items: T[],
    batchSize: number = 100
  ) {
    const supabase = await createClient();
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch as any)
        .select();

      if (error) throw error;
      results.push(...(data || []));
    }

    return results;
  }

  // Optimize pagination with cursor-based approach
  static async cursorPagination(
    tableName: string,
    cursor: string | null,
    limit: number = 20
  ) {
    const supabase = await createClient();
    let query = supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    return query;
  }

  // Use RLS policies for row-level filtering (better than WHERE clauses)
  static async setupRLSPolicies(tableName: string) {
    // RLS policies should be set up in Supabase dashboard
    // This is just a reference for what policies to create
    return {
      select_policy: `
        CREATE POLICY "Users can view public listings" ON ${tableName}
        FOR SELECT USING (status = 'ACTIVE' OR user_id = auth.uid());
      `,
      insert_policy: `
        CREATE POLICY "Users can insert own listings" ON ${tableName}
        FOR INSERT WITH CHECK (user_id = auth.uid());
      `,
      update_policy: `
        CREATE POLICY "Users can update own listings" ON ${tableName}
        FOR UPDATE USING (user_id = auth.uid());
      `,
    };
  }

  // Use database views for complex queries
  static createMaterializedView() {
    return `
      CREATE MATERIALIZED VIEW IF NOT EXISTS listings_summary AS
      SELECT 
        type,
        mineral,
        region,
        COUNT(*) as count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM kazakhstan_deposits
      WHERE status = 'ACTIVE'
      GROUP BY type, mineral, region
      WITH DATA;

      CREATE UNIQUE INDEX ON listings_summary (type, mineral, region);
    `;
  }

  // Optimize full-text search
  static async setupFullTextSearch(tableName: string) {
    return `
      -- Add text search vector column
      ALTER TABLE ${tableName} 
      ADD COLUMN IF NOT EXISTS search_vector tsvector;

      -- Create index for full-text search
      CREATE INDEX IF NOT EXISTS ${tableName}_search_idx 
      ON ${tableName} 
      USING gin(search_vector);

      -- Update search vector on insert/update
      CREATE OR REPLACE FUNCTION update_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(NEW.mineral, '')), 'C') ||
          setweight(to_tsvector('simple', coalesce(NEW.region, '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_search_vector_trigger
      BEFORE INSERT OR UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION update_search_vector();
    `;
  }

  // Use connection pooling configuration
  static getPoolConfig() {
    return {
      max: 20, // Maximum number of connections in pool
      min: 5, // Minimum number of connections in pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be acquired
    };
  }
}

// Query performance monitoring
export class QueryMonitor {
  static async measureQueryTime<T>(
    queryFn: () => Promise<T>,
    queryName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }

    return { result, duration };
  }

  static async analyzeQueryPlan(sql: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('explain_query', { query: sql });

    if (error) {
      console.error('Query plan analysis failed:', error);
      return null;
    }

    return data;
  }
}

// Index suggestions based on common queries
export const INDEX_SUGGESTIONS = `
  -- Composite indexes for common filter combinations
  CREATE INDEX idx_deposits_type_status ON kazakhstan_deposits(type, status);
  CREATE INDEX idx_deposits_mineral_region ON kazakhstan_deposits(mineral, region);
  CREATE INDEX idx_deposits_price_area ON kazakhstan_deposits(price, area) WHERE price IS NOT NULL;
  
  -- Partial indexes for filtered queries
  CREATE INDEX idx_active_deposits ON kazakhstan_deposits(created_at DESC) WHERE status = 'ACTIVE';
  CREATE INDEX idx_featured_deposits ON kazakhstan_deposits(featured, created_at DESC) WHERE featured = true;
  
  -- BRIN index for time-series data (more efficient for large tables)
  CREATE INDEX idx_deposits_created_brin ON kazakhstan_deposits USING brin(created_at);
`;
