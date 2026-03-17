# QAZNEDR.KZ Platform Roadmap & Stage 1 Design

## Vision

QAZNEDR.KZ is a B2B marketplace for Kazakhstan's mining industry — like Alibaba but for mineral deposits, licenses, and geology services. Sellers list deposits, buyers/investors find and contact them, service providers offer related services (drilling, consulting, audit, etc.). Free at launch to build mass, with monetization built in from day one.

Key audiences: Kazakh mining companies, Chinese investors seeking land/deposits in KZ, international buyers, geology service providers.

---

## Platform Roadmap

### Stage 1: Authentication, Profiles, Dashboard

Foundation for everything. Users register, pick a profile type, manage their account.

### Stage 2: Listing Creation & Moderation

Sellers create deposit listings with photos/docs. First 2 listings go through admin moderation; after approval, seller publishes freely. Statuses: draft → pending_moderation → published / rejected.

### Stage 3: Catalog, Search & Contact Access

Buyers browse, filter, sort, view on map. "Show contacts" button requires registration (builds user base, tracks contact views for future monetization).

### Stage 4: Services Catalog

Separate section for service providers: drilling companies, geological consultants, auditors, legal firms, lab services, reserve estimation. Service cards with filters by type/region.

### Stage 5: Monetization

Stripe/Kaspi payment integration. Sellers: promoted/featured listings, subscription tiers. Buyers: contact access packages (first N free, then paid). All flags already in DB from Stage 1.

### Stage 6: SEO + AI Search + China

JSON-LD structured data, dynamic sitemap, meta tags. Optimization for ChatGPT/Perplexity/Google AI Overviews. Baidu SEO, China CDN accessibility. Chinese language already available from Stage 1.

### Stage 7: UX Polish

Onboarding flow, tooltips, mobile optimization, performance (Core Web Vitals), A/B testing for conversion.

---

## Stage 1: Detailed Design

### 1. Authentication

**Provider:** Supabase Auth (already integrated in the project)

**Methods:**

- Email + password registration
- Google OAuth
- (Future: phone + SMS — not in this stage)

**Flow:**

1. User clicks "Register" → chooses method (email or Google)
2. If email: enters name, email, password → email confirmation link sent
3. If Google: OAuth redirect → auto-fill name/email
4. After auth: profile type selection screen (one-time)
5. Redirect to dashboard

**Session:** Supabase handles JWT tokens. Session persists via cookies (already set up with NextAuth — needs migration to Supabase Auth or keep NextAuth with Supabase adapter).

### 2. Profile Types

Single account, multiple capabilities. Profile type determines UI and recommendations but does NOT restrict actions.

**Types (enum `profile_type`):**

- `subsoil_user` — Недропользователь (sells deposits/licenses)
- `service_provider` — Сервис-провайдер (offers geology services)
- `investor` — Инвестор/Покупатель (looks for deposits to buy/invest)

User selects type at registration. Can change later in settings.

### 3. Profile Data

**Required at registration (minimal barrier):**

- `full_name` — string
- `email` — string (from auth)
- `profile_type` — enum
- `country` — string (dropdown, default: Kazakhstan)

**Optional (filled later in dashboard):**

- `company_name` — string
- `phone` — string
- `description` — text (about the company/person)
- `avatar_url` — string (profile photo/logo)
- `city` — string
- `website` — string
- For service providers: `service_types` — array of strings (drilling, consulting, audit, legal, lab, reserve_estimation)

**Monetization fields (set by system, not user):**

- `contacts_viewed_count` — integer, default 0
- `contacts_viewed_limit` — integer, default null (null = unlimited for now)
- `is_verified` — boolean, default false
- `verified_at` — timestamp, nullable
- `verification_document_url` — string, nullable

### 4. Database Schema (Supabase)

```sql
-- Extend existing profiles table or create new one
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('subsoil_user', 'service_provider', 'investor')),
  country TEXT DEFAULT 'Kazakhstan',
  company_name TEXT,
  phone TEXT,
  description TEXT,
  avatar_url TEXT,
  city TEXT,
  website TEXT,
  service_types TEXT[], -- for service providers
  contacts_viewed_count INTEGER DEFAULT 0,
  contacts_viewed_limit INTEGER, -- null = unlimited
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_document_url TEXT,
  is_trusted_seller BOOLEAN DEFAULT FALSE, -- auto-publish after moderation of first 2 listings
  listings_moderated_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can read any profile, but only update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 5. Dashboard (Personal Cabinet)

**Tabs/sections:**

- **Profile** — view/edit profile info, upload avatar
- **My Listings** — placeholder for Stage 2 (shows "You haven't listed anything yet" with CTA)
- **Viewed Contacts** — counter, history of which contacts user viewed (for future monetization)
- **Settings** — change password, language preference, notification settings
- **Verification** — upload document, see status (pending/approved/rejected)

### 6. Languages

4 languages from day one: Russian (ru), Kazakh (kz), English (en), Chinese (zh).

Chinese translation file `src/messages/zh.json` needs to be created with all keys. Existing `i18n` infrastructure (next-intl) already supports multiple locales — just add zh to the list.

### 7. Key Decisions

- **Auth provider:** Supabase Auth (not NextAuth) — simplifies stack, one less dependency, better integration with Supabase RLS. Migrate from current NextAuth setup.
- **No Payload CMS** — not needed for a marketplace. Supabase handles data, Next.js handles rendering.
- **No OpenCart/Shopify** — wrong tool for a listing marketplace.
- **Profile type is soft** — guides UI, doesn't restrict. Any user can list and buy.
- **Moderation threshold** — `is_trusted_seller` flips to true after 2 approved listings (Stage 2 implements this).
- **Contact view tracking** — every "show contacts" click increments counter and logs to a `contact_views` table (for analytics + future paywall).

### 8. Contact Views Table (for monetization prep)

```sql
CREATE TABLE contact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID, -- will reference listings table from Stage 2
  seller_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can see their own views
ALTER TABLE contact_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own contact views"
  ON contact_views FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Users can insert own contact views"
  ON contact_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
```

### 9. What This Stage Does NOT Include

- Listing creation (Stage 2)
- Search/browse functionality changes (Stage 3)
- Payment processing (Stage 5)
- SEO optimization (Stage 6)
- Admin panel for moderation (Stage 2)

### 10. Success Criteria

- User can register with email+password or Google
- User selects profile type and country at registration
- User can view and edit their profile in dashboard
- User can upload avatar/logo
- User can start verification process (upload document)
- All UI available in 4 languages (ru, kz, en, zh)
- Contact views are tracked (counter on profile, rows in contact_views)
- Mobile-responsive
- Builds and deploys without errors
