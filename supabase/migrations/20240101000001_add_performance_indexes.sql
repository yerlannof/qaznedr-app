-- Migration: Add performance indexes and search capabilities
-- Date: 2024-01-01
-- Description: Optimize database performance with indexes and full-text search

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deposits_type_status 
ON kazakhstan_deposits(type, status);

CREATE INDEX IF NOT EXISTS idx_deposits_mineral_region 
ON kazakhstan_deposits(mineral, region);

CREATE INDEX IF NOT EXISTS idx_deposits_price_area 
ON kazakhstan_deposits(price, area) 
WHERE price IS NOT NULL;

-- Partial indexes for filtered queries  
CREATE INDEX IF NOT EXISTS idx_active_deposits 
ON kazakhstan_deposits(created_at DESC) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_featured_deposits 
ON kazakhstan_deposits(featured, created_at DESC) 
WHERE featured = true;

-- BRIN index for time-series data
CREATE INDEX IF NOT EXISTS idx_deposits_created_brin 
ON kazakhstan_deposits USING brin(created_at);

-- Full text search support
ALTER TABLE kazakhstan_deposits 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS kazakhstan_deposits_search_idx 
ON kazakhstan_deposits USING gin(search_vector);

-- Function to update search vector
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

-- Trigger for search vector updates
DROP TRIGGER IF EXISTS update_search_vector_trigger ON kazakhstan_deposits;
CREATE TRIGGER update_search_vector_trigger
BEFORE INSERT OR UPDATE ON kazakhstan_deposits
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- Update existing records
UPDATE kazakhstan_deposits 
SET search_vector = 
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(mineral, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(region, '')), 'C')
WHERE search_vector IS NULL;