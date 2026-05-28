-- QAZNEDR leads layer: public teaser (leads) ⟂ gated private (lead_private) + entitlement/funnel/audit.
-- Security model: portal authenticates via NextAuth (NOT Supabase Auth). Gated tables therefore use
-- RLS ENABLED with NO policy => deny-all to anon/authenticated keys; only the server-only service-role
-- key (bypasses RLS) reads/writes them, after app-level entitlement checks. Public teaser = leads with
-- a single SELECT-published policy.

create extension if not exists "pgcrypto";

-- 1. PUBLIC TEASER -----------------------------------------------------------
create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- 'AU-300', 'AU-CLUSTER-308'
  registry_ref         text not null,                   -- id in au_master_registry
  mineral              text not null default 'Au',
  type                 text not null,                   -- 'placer' | 'bedrock'
  region               text,                            -- область (broad, public)
  tier                 text not null default 'TIER1_PLACER'
                         check (tier in ('TIER1_PLACER','TIER2_BOMB')),
  exclusivity          text not null default 'MASS'
                         check (exclusivity in ('MASS','EXCLUSIVE')),
  teaser_title         text,
  teaser_summary       text,
  grade_display        text,                            -- sanitized, type-labelled
  grade_label          text,
  byproducts_display   text,
  reserve_categories   text[],                          -- ['C2','P1'] presence
  license_status       text,                            -- 'FREE'|'OCCUPIED'|...
  last_verified        date,
  distance_band        text,                            -- 'в пределах 300 км от Алматы'
  map_centroid         jsonb,                           -- region centroid, NOT object point
  fair_value_min_usd_m numeric,
  fair_value_max_usd_m numeric,
  jorc_potential_usd_m numeric,
  price_display        text,
  confidence           int,
  status               text not null default 'DRAFT'
                         check (status in ('DRAFT','PUBLISHED','SOLD','ARCHIVED')),
  sold_count           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  published_at         timestamptz,
  unique (registry_ref)
);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_region on public.leads(region);
create index if not exists idx_leads_tier   on public.leads(tier);

-- 2. GATED PRIVATE -----------------------------------------------------------
create table if not exists public.lead_private (
  lead_id          uuid primary key references public.leads(id) on delete cascade,
  registry_ref     text not null,
  name             text,
  name_variants    text,
  raion            text,
  locality         text,
  lat              numeric,
  lon              numeric,
  gps_accuracy_km  numeric,
  grade_full       text,
  reserves_full    jsonb,
  holder           text,
  contract_id      text,
  source_books     text,
  our_files        text,
  methodology      text,
  ssot_doc         text,
  extraction_notes text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 3. ENTITLEMENTS ------------------------------------------------------------
create table if not exists public.lead_entitlements (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  -- user ids are NextAuth ids (text). No FK on purpose: live Supabase has no public.users
  -- table and profiles may be empty; the app validates the user via session.
  user_id         text not null,
  granted_by      text,
  grant_reason    text not null default 'ADMIN_MANUAL'
                    check (grant_reason in ('ADMIN_MANUAL','PAYMENT','COMP')),
  payment_ref     text,
  nda_accepted_at timestamptz,
  watermark_token text not null,
  status          text not null default 'ACTIVE'
                    check (status in ('ACTIVE','REVOKED','EXPIRED')),
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (lead_id, user_id)
);
create index if not exists idx_entl_user on public.lead_entitlements(user_id);
create index if not exists idx_entl_lead on public.lead_entitlements(lead_id);

-- 4. INTEREST FUNNEL ---------------------------------------------------------
create table if not exists public.lead_unlock_requests (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  user_id       text not null,
  message       text,
  contact_phone text,
  status        text not null default 'NEW'
                  check (status in ('NEW','CONTACTED','DEAL','REJECTED')),
  created_at    timestamptz not null default now()
);
create index if not exists idx_unlock_status on public.lead_unlock_requests(status);

-- 5. ACCESS LOG --------------------------------------------------------------
create table if not exists public.lead_access_log (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  user_id         text,
  entitlement_id  uuid references public.lead_entitlements(id),
  action          text not null
                    check (action in ('VIEW_PRIVATE','DOWNLOAD_PDF','VIEW_GPS')),
  ip              text,
  user_agent      text,
  watermark_token text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_access_lead on public.lead_access_log(lead_id);

-- RLS -----------------------------------------------------------------------
alter table public.leads                enable row level security;
alter table public.lead_private         enable row level security;
alter table public.lead_entitlements    enable row level security;
alter table public.lead_unlock_requests enable row level security;
alter table public.lead_access_log      enable row level security;

-- leads: public can read PUBLISHED only. (writes -> service-role; no write policy = denied.)
drop policy if exists "public read published leads" on public.leads;
create policy "public read published leads" on public.leads
  for select using (status = 'PUBLISHED');

-- lead_private / lead_entitlements / lead_unlock_requests / lead_access_log:
-- NO policies on purpose => anon & authenticated keys get nothing.
-- All access via server-only service-role key (bypasses RLS) after app-level checks.
