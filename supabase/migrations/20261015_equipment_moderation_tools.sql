-- Moderation tools for the equipment marketplace (15.10.2026): trust marks set by
-- moderators, automatic pre-check results and reserved paid-placement columns.
-- Server-only like the rest of the marketplace: no anon/authenticated access.
begin;

-- Paid placement is not sold yet; the columns exist so tariffs need no data move.
alter table public.equipment_listings
  add column if not exists plan text not null default 'FREE'
    check (plan in ('FREE', 'FEATURED')),
  add column if not exists featured_until timestamptz;

create table if not exists public.equipment_trust_marks (
  listing_id uuid not null references public.equipment_listings(id) on delete cascade,
  mark text not null
    check (mark in ('PHONE_CONFIRMED', 'DOCUMENTS_REVIEWED', 'VERIFIED_QAZNEDR')),
  set_by text not null check (length(set_by) between 1 and 160),
  set_at timestamptz not null default now(),
  note text check (note is null or length(note) <= 500),
  primary key (listing_id, mark)
);

-- One pre-check per submitted revision. Advice for the moderator, never a decision.
create table if not exists public.equipment_prechecks (
  listing_id uuid not null references public.equipment_listings(id) on delete cascade,
  revision integer not null check (revision > 0),
  verdict text not null check (verdict in ('OK', 'REVIEW', 'REJECT_SUGGESTED')),
  flags jsonb not null default '[]'::jsonb
    check (jsonb_typeof(flags) = 'array' and pg_column_size(flags) <= 8192),
  summary text check (summary is null or length(summary) <= 1000),
  model text not null check (length(model) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (listing_id, revision)
);

alter table public.equipment_trust_marks enable row level security;
alter table public.equipment_prechecks enable row level security;
revoke all on table public.equipment_trust_marks from public, anon, authenticated;
revoke all on table public.equipment_prechecks from public, anon, authenticated;
grant select, insert, update, delete on table public.equipment_trust_marks to service_role;
grant select, insert, update on table public.equipment_prechecks to service_role;

commit;
