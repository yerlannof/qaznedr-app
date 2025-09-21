-- Create enum types
CREATE TYPE listing_type AS ENUM ('MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE');
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'SOLD', 'PENDING', 'DRAFT');
CREATE TYPE license_subtype AS ENUM ('EXTRACTION_RIGHT', 'PROCESSING_RIGHT', 'TRANSPORTATION_RIGHT', 'COMBINED_RIGHT');
CREATE TYPE exploration_stage AS ENUM ('PRELIMINARY', 'DETAILED', 'FEASIBILITY', 'ENVIRONMENTAL');
CREATE TYPE geological_confidence AS ENUM ('INFERRED', 'INDICATED', 'MEASURED');
CREATE TYPE accessibility_rating AS ENUM ('EASY', 'MODERATE', 'DIFFICULT', 'VERY_DIFFICULT');

-- Create the main kazakhstan_deposits table
CREATE TABLE kazakhstan_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type listing_type NOT NULL,
  mineral TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  area NUMERIC NOT NULL,
  price NUMERIC,
  coordinates JSONB NOT NULL,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  status listing_status DEFAULT 'DRAFT',
  images JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Mining license specific fields
  license_subtype license_subtype,
  license_number TEXT,
  license_expiry DATE,
  annual_production_limit NUMERIC,
  
  -- Exploration license specific fields
  exploration_stage exploration_stage,
  exploration_start DATE,
  exploration_end DATE,
  exploration_budget NUMERIC,
  
  -- Mineral occurrence specific fields
  discovery_date DATE,
  geological_confidence geological_confidence,
  estimated_reserves NUMERIC,
  accessibility_rating accessibility_rating
);

-- Create indexes for better query performance
CREATE INDEX idx_deposits_type ON kazakhstan_deposits(type);
CREATE INDEX idx_deposits_mineral ON kazakhstan_deposits(mineral);
CREATE INDEX idx_deposits_region ON kazakhstan_deposits(region);
CREATE INDEX idx_deposits_status ON kazakhstan_deposits(status);
CREATE INDEX idx_deposits_featured ON kazakhstan_deposits(featured);
CREATE INDEX idx_deposits_verified ON kazakhstan_deposits(verified);
CREATE INDEX idx_deposits_created_at ON kazakhstan_deposits(created_at DESC);
CREATE INDEX idx_deposits_price ON kazakhstan_deposits(price);

-- Enable Row Level Security
ALTER TABLE kazakhstan_deposits ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON kazakhstan_deposits
  FOR SELECT USING (true);

-- Create policy for authenticated users to manage their own listings
CREATE POLICY "Users can manage their own listings" ON kazakhstan_deposits
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_kazakhstan_deposits_updated_at 
  BEFORE UPDATE ON kazakhstan_deposits 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();