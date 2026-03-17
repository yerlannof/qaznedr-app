-- Profiles table for user data (linked to NextAuth user IDs)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'investor'
    CHECK (profile_type IN ('subsoil_user', 'service_provider', 'investor')),
  country TEXT DEFAULT 'Kazakhstan',
  company_name TEXT,
  phone TEXT,
  description TEXT,
  avatar_url TEXT,
  city TEXT,
  website TEXT,
  service_types TEXT[],
  contacts_viewed_count INTEGER DEFAULT 0,
  contacts_viewed_limit INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_document_url TEXT,
  is_trusted_seller BOOLEAN DEFAULT FALSE,
  listings_moderated_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
