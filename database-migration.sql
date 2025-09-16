-- SUPABASE DATABASE MIGRATION SCRIPT
-- Execute this in Supabase SQL Editor to create all tables
-- This creates the complete schema with correct naming conventions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main kazakhstan_deposits table
CREATE TABLE IF NOT EXISTS kazakhstan_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE')),
    mineral TEXT NOT NULL,
    region TEXT NOT NULL,
    city TEXT,
    area REAL,
    price REAL,
    coordinates JSONB,
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'PENDING', 'DRAFT')),
    user_id UUID,
    
    -- Mining license specific fields
    license_subtype TEXT,
    license_number TEXT,
    license_expiry TIMESTAMPTZ,
    annual_production_limit REAL,
    
    -- Exploration license specific fields
    exploration_stage TEXT,
    exploration_start TIMESTAMPTZ,
    exploration_end TIMESTAMPTZ,
    exploration_budget REAL,
    
    -- Mineral occurrence specific fields
    discovery_date TIMESTAMPTZ,
    geological_confidence TEXT,
    estimated_reserves REAL,
    accessibility_rating TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_region ON kazakhstan_deposits(region);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_mineral ON kazakhstan_deposits(mineral);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_type ON kazakhstan_deposits(type);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_status ON kazakhstan_deposits(status);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_verified ON kazakhstan_deposits(verified);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_featured ON kazakhstan_deposits(featured);
CREATE INDEX IF NOT EXISTS idx_kazakhstan_deposits_created_at ON kazakhstan_deposits(created_at);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    deposit_id UUID NOT NULL REFERENCES kazakhstan_deposits(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, deposit_id)
);

-- Views tracking table
CREATE TABLE IF NOT EXISTS views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL REFERENCES kazakhstan_deposits(id) ON DELETE CASCADE,
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_deposit_id ON views(deposit_id);
CREATE INDEX IF NOT EXISTS idx_views_created_at ON views(created_at);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL REFERENCES kazakhstan_deposits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('LICENSE', 'GEOLOGICAL_SURVEY', 'ENVIRONMENTAL', 'FINANCIAL', 'LEGAL', 'OTHER')),
    url TEXT NOT NULL,
    size INTEGER,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_deposit_id ON documents(deposit_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Contact requests table
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL REFERENCES kazakhstan_deposits(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL,
    to_user_id UUID NOT NULL,
    message TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESPONDED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_deposit_id ON contact_requests(deposit_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_from_user_id ON contact_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_to_user_id ON contact_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('NEW_DEPOSIT', 'PRICE_CHANGE', 'AUCTION_START', 'AUCTION_END', 'MESSAGE', 'SYSTEM')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    properties JSONB,
    user_id UUID,
    session_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    stack TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    fingerprint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    context JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    user_id UUID,
    session_id TEXT,
    url TEXT,
    component TEXT,
    action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Enable Row Level Security
ALTER TABLE kazakhstan_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_kazakhstan_deposits_updated_at BEFORE UPDATE ON kazakhstan_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO kazakhstan_deposits (
    title, description, type, mineral, region, city, area, price, coordinates, verified, featured,
    license_subtype, license_number, license_expiry, annual_production_limit
) VALUES (
    'Кашаган - Нефтяное месторождение',
    'Одно из крупнейших нефтяных месторождений в мире, расположенное в Каспийском море',
    'MINING_LICENSE',
    'Нефть',
    'Мангистауская',
    'Атырау',
    5792.0,
    15000000000.0,
    '{"lat": 46.8625, "lng": 51.2183}',
    true,
    true,
    'EXTRACTION_RIGHT',
    'ML-KZ-2024-001',
    '2040-12-31T23:59:59Z',
    50000000.0
) ON CONFLICT (id) DO NOTHING;