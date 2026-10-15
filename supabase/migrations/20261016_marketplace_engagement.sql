-- Marketplace engagement (16.10.2026): per-day listing stats, responses to
-- WANTED requests, company profiles and catalogue e-mail subscriptions.
-- Everything is service-role only; the app server mediates all access.
begin;

-- 1. Daily views and contact clicks per published listing.
create table if not exists public.equipment_listing_stats (
  listing_id uuid not null references public.equipment_listings(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Almaty')::date,
  views integer not null default 0 check (views >= 0),
  contact_clicks integer not null default 0 check (contact_clicks >= 0),
  primary key (listing_id, day)
);

create or replace function public.record_equipment_listing_event(
  p_listing_id uuid,
  p_kind text
) returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $function$
begin
  if p_kind not in ('view', 'contact') then
    raise exception 'invalid listing event' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.equipment_listings
    where id = p_listing_id and status = 'ACTIVE'
  ) then
    return false;
  end if;
  insert into public.equipment_listing_stats as s (listing_id, views, contact_clicks)
  values (p_listing_id, (p_kind = 'view')::int, (p_kind = 'contact')::int)
  on conflict (listing_id, day) do update
  set views = s.views + excluded.views,
      contact_clicks = s.contact_clicks + excluded.contact_clicks;
  return true;
end
$function$;

-- 2. Responses ("Предложить") to published WANTED requests.
create table if not exists public.equipment_responses (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  listing_id uuid not null references public.equipment_listings(id) on delete cascade,
  name text not null check (length(name) between 1 and 120 and name = btrim(name)),
  phone text not null check (phone ~ '^\+[0-9]{7,15}$'),
  message text not null check (length(message) between 1 and 2000),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists equipment_responses_listing_idx
  on public.equipment_responses (listing_id, created_at desc);
create index if not exists equipment_responses_ip_idx
  on public.equipment_responses (ip_hash, created_at desc);

-- Returns 'saved', 'not_found' or 'rate_limited'.
create or replace function public.submit_equipment_response(
  p_listing_id uuid,
  p_name text,
  p_phone text,
  p_message text,
  p_ip_hash text
) returns text
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $function$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('equipment-response:' || p_ip_hash, 0));
  if not exists (
    select 1 from public.equipment_listings
    where id = p_listing_id and status = 'ACTIVE' and data->>'offerType' = 'WANTED'
  ) then
    return 'not_found';
  end if;
  if (select count(*) from public.equipment_responses
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5
     or exists (select 1 from public.equipment_responses
      where listing_id = p_listing_id and phone = p_phone
        and created_at > now() - interval '1 day')
  then
    return 'rate_limited';
  end if;
  insert into public.equipment_responses (listing_id, name, phone, message, ip_hash)
  values (p_listing_id, p_name, p_phone, p_message, p_ip_hash);
  return 'saved';
end
$function$;

-- 3. Company profiles, published after a moderator approves them.
create table if not exists public.marketplace_companies (
  owner_id text primary key check (length(owner_id) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  name text not null check (length(name) between 2 and 160 and name = btrim(name)),
  description text check (length(description) <= 3000),
  website text check (website ~ '^https://[^[:space:]]{3,200}$'),
  city text check (length(city) <= 120),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'HIDDEN')),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_companies_status_idx
  on public.marketplace_companies (status, updated_at desc);

-- 4. Double opt-in e-mail subscriptions to new catalogue listings.
create table if not exists public.equipment_subscriptions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  email text not null check (
    length(email) between 3 and 254 and email = lower(btrim(email)) and
    email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  locale text not null default 'ru' check (locale in ('ru', 'kz', 'en', 'zh')),
  confirm_hash text not null unique check (confirm_hash ~ '^[0-9a-f]{64}$'),
  unsubscribe_hash text not null unique check (unsubscribe_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_sent_at timestamptz
);
create index if not exists equipment_subscriptions_email_idx
  on public.equipment_subscriptions (email);
create index if not exists equipment_subscriptions_ip_idx
  on public.equipment_subscriptions (ip_hash, created_at desc);
create index if not exists equipment_subscriptions_due_idx
  on public.equipment_subscriptions (confirmed_at) where confirmed_at is not null;

-- Lock everything down: no browser role touches these tables or functions.
do $grants$
declare t text;
begin
  foreach t in array array[
    'equipment_listing_stats', 'equipment_responses',
    'marketplace_companies', 'equipment_subscriptions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end
$grants$;

revoke all on function public.record_equipment_listing_event(uuid, text)
  from public, anon, authenticated;
revoke all on function public.submit_equipment_response(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_equipment_listing_event(uuid, text) to service_role;
grant execute on function public.submit_equipment_response(uuid, text, text, text, text) to service_role;

commit;
