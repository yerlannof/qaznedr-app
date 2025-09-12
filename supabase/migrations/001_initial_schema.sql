-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  role VARCHAR(50) DEFAULT 'BUYER' CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
  company VARCHAR(255),
  phone VARCHAR(50),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create kazakhstan_deposits table
CREATE TABLE IF NOT EXISTS public.kazakhstan_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE')),
  mineral VARCHAR(100) NOT NULL,
  region VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  area DECIMAL(10, 2) NOT NULL,
  price DECIMAL(15, 2),
  coordinates JSONB NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'PENDING', 'DRAFT')),
  images JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Mining license specific fields
  license_subtype VARCHAR(100),
  license_number VARCHAR(255),
  license_expiry DATE,
  annual_production_limit DECIMAL(15, 2),
  
  -- Exploration license specific fields
  exploration_stage VARCHAR(100),
  exploration_start DATE,
  exploration_end DATE,
  exploration_budget DECIMAL(15, 2),
  
  -- Mineral occurrence specific fields
  discovery_date DATE,
  geological_confidence VARCHAR(100),
  estimated_reserves DECIMAL(15, 2),
  accessibility_rating VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  starting_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2),
  reserve_price DECIMAL(15, 2),
  buy_now_price DECIMAL(15, 2),
  bid_increment DECIMAL(10, 2) DEFAULT 100000,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'ENDED', 'CANCELLED')),
  winner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  is_auto_bid BOOLEAN DEFAULT FALSE,
  max_auto_bid DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo TEXT,
  website VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  region VARCHAR(255),
  category TEXT[] DEFAULT '{}',
  services JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  portfolio JSONB DEFAULT '[]'::jsonb,
  rating DECIMAL(3, 2),
  reviews_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price_range VARCHAR(100),
  duration VARCHAR(100),
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  investment_type VARCHAR(50) NOT NULL CHECK (investment_type IN ('PURCHASE', 'PARTNERSHIP', 'LEASE')),
  amount DECIMAL(15, 2) NOT NULL,
  share_percentage DECIMAL(5, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  roi DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  price DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KZT',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, deposit_id)
);

-- Create views table
CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contact_requests table
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES public.kazakhstan_deposits(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id),
  to_user_id UUID NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESPONDED', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_kazakhstan_deposits_region ON public.kazakhstan_deposits(region);
CREATE INDEX idx_kazakhstan_deposits_mineral ON public.kazakhstan_deposits(mineral);
CREATE INDEX idx_kazakhstan_deposits_type ON public.kazakhstan_deposits(type);
CREATE INDEX idx_kazakhstan_deposits_status ON public.kazakhstan_deposits(status);
CREATE INDEX idx_kazakhstan_deposits_verified ON public.kazakhstan_deposits(verified);
CREATE INDEX idx_kazakhstan_deposits_featured ON public.kazakhstan_deposits(featured);
CREATE INDEX idx_kazakhstan_deposits_created_at ON public.kazakhstan_deposits(created_at);
CREATE INDEX idx_kazakhstan_deposits_user_id ON public.kazakhstan_deposits(user_id);

CREATE INDEX idx_auctions_deposit_id ON public.auctions(deposit_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_end_date ON public.auctions(end_date);

CREATE INDEX idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX idx_bids_user_id ON public.bids(user_id);

CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_verified ON public.companies(verified);
CREATE INDEX idx_companies_region ON public.companies(region);

CREATE INDEX idx_services_company_id ON public.services(company_id);
CREATE INDEX idx_services_category ON public.services(category);

CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_deposit_id ON public.investments(deposit_id);
CREATE INDEX idx_investments_status ON public.investments(status);

CREATE INDEX idx_price_history_deposit_id ON public.price_history(deposit_id);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_deposit_id ON public.favorites(deposit_id);

CREATE INDEX idx_views_deposit_id ON public.views(deposit_id);
CREATE INDEX idx_views_created_at ON public.views(created_at);

CREATE INDEX idx_documents_deposit_id ON public.documents(deposit_id);
CREATE INDEX idx_documents_type ON public.documents(type);

CREATE INDEX idx_contact_requests_deposit_id ON public.contact_requests(deposit_id);
CREATE INDEX idx_contact_requests_from_user_id ON public.contact_requests(from_user_id);
CREATE INDEX idx_contact_requests_to_user_id ON public.contact_requests(to_user_id);
CREATE INDEX idx_contact_requests_status ON public.contact_requests(status);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kazakhstan_deposits_updated_at BEFORE UPDATE ON public.kazakhstan_deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();