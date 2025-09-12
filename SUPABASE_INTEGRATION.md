# Supabase Integration Guide for QAZNEDR.KZ

## Overview

This guide explains how to integrate Supabase as the primary database for the QAZNEDR.KZ mining platform, replacing the local SQLite/Prisma setup.

## Why Supabase?

- **Scalable PostgreSQL Database** - Production-ready from day one
- **Built-in Authentication** - User management and secure sessions
- **Real-time Subscriptions** - Live updates for listings and bids
- **Storage** - File uploads for documents and images
- **Row Level Security** - Fine-grained access control
- **REST and GraphQL APIs** - Flexible data access

## Database Schema

### Core Tables

```sql
-- Users table (managed by Supabase Auth)
-- Automatically created by Supabase

-- Mining listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('MINING_LICENSE', 'EXPLORATION_LICENSE', 'MINERAL_OCCURRENCE')),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  price DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'KZT',

  -- Location fields
  region VARCHAR(100),
  coordinates JSONB,
  area_size DECIMAL(10, 2),

  -- Mineral information
  mineral_type VARCHAR(50),
  estimated_reserves TEXT,
  geological_confidence VARCHAR(50),

  -- License specific fields
  license_number VARCHAR(100),
  license_expiry DATE,
  license_subtype VARCHAR(50),

  -- Exploration specific fields
  exploration_stage VARCHAR(50),
  exploration_period INTEGER,
  exploration_budget DECIMAL(15, 2),

  -- Metadata
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE
);

-- Favorites table
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Inquiries table
CREATE TABLE inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_region ON listings(region);
CREATE INDEX idx_listings_mineral ON listings(mineral_type);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_inquiries_listing ON inquiries(listing_id);
```

## Environment Variables

Add to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Remove old Prisma configuration
# DATABASE_URL=file:./dev.db (no longer needed)
```

## Installation

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2. Create Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

## API Routes Migration

### Example: Fetching Listings

Before (Prisma):

```typescript
// app/api/listings/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
  });
  return Response.json(listings);
}
```

After (Supabase):

```typescript
// app/api/listings/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(listings);
}
```

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      company: 'Mining Corp',
    },
  },
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

### Get Current User

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
```

## Real-time Subscriptions

Subscribe to listing updates:

```typescript
// In a client component
useEffect(() => {
  const channel = supabase
    .channel('listings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'listings',
      },
      (payload) => {
        console.log('Change received!', payload);
        // Update your state here
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Row Level Security (RLS)

Enable RLS for tables and create policies:

```sql
-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
```

## Storage for Documents

Set up storage buckets for listing documents:

```typescript
// Upload a document
const { data, error } = await supabase.storage
  .from('listing-documents')
  .upload(`listings/${listingId}/${fileName}`, file);

// Get public URL
const { data } = supabase.storage
  .from('listing-documents')
  .getPublicUrl(`listings/${listingId}/${fileName}`);
```

## Migration Checklist

- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure environment variables
- [ ] Install Supabase packages
- [ ] Create Supabase client utilities
- [ ] Migrate API routes from Prisma to Supabase
- [ ] Update authentication to use Supabase Auth
- [ ] Set up Row Level Security policies
- [ ] Configure storage buckets for files
- [ ] Test all CRUD operations
- [ ] Set up real-time subscriptions where needed
- [ ] Remove Prisma dependencies and files

## MCP Server Integration

With the Supabase MCP server configured, you can:

1. Query the database directly in Claude
2. Modify schema and data
3. Test queries before implementing
4. Debug issues with direct database access

Example commands in Claude with MCP:

- "Show me all listings in the Supabase database"
- "Create a new table for bid history"
- "Update the listing status to SOLD where id = ..."

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [MCP Supabase Server](https://github.com/modelcontextprotocol/servers/tree/main/supabase)
- [Project MCP Setup Guide](./MCP_SETUP_GUIDE.md)
