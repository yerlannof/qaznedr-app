-- Qaznedr block extension (T-0220): teaser per 1′ block, install keys, limits, demand counter.
-- All tables are server-only: RLS on, no policies, no grants to anon/authenticated.

create table if not exists public.ext_block_teaser (
  code   text primary key,          -- M-44-129-(10e-5a-5)
  n      text not null,             -- 1 | 2–3 | 4–9 | 10+ (objects within 5 km)
  metals text[] not null default '{}',
  stage  text not null,
  sheet  text not null,             -- M-44-129
  ver    bigint not null
);

create table if not exists public.ext_sheet_reports (
  sheet   text primary key,
  reports integer not null,
  ver     bigint not null
);

-- One row per install. Only hashes: the random key, the browser fingerprint, the network (salted per day).
create table if not exists public.ext_installs (
  key_hash   text primary key,
  fp_hash    text not null,
  net_day    text not null,          -- hmac(day, /24 or /48) at registration
  created_at timestamptz not null default now(),
  blocked    text                    -- reason, null = active
);
create index if not exists ext_installs_net_day on public.ext_installs (net_day, created_at);
create index if not exists ext_installs_fp on public.ext_installs (fp_hash, created_at);

-- One row per block view that counted against a limit. No IP, no name.
create table if not exists public.ext_views (
  id       bigserial primary key,
  at       timestamptz not null default now(),
  day      date not null default (now() at time zone 'Asia/Almaty')::date,
  key_hash text not null,
  fp_hash  text not null,
  net_day  text not null,
  code     text not null,
  found    boolean not null
);
create index if not exists ext_views_key_day on public.ext_views (key_hash, day);
create index if not exists ext_views_fp_day on public.ext_views (fp_hash, day);
create index if not exists ext_views_net_day on public.ext_views (net_day, day);
create index if not exists ext_views_code on public.ext_views (code);

alter table public.ext_block_teaser enable row level security;
alter table public.ext_sheet_reports enable row level security;
alter table public.ext_installs enable row level security;
alter table public.ext_views enable row level security;
revoke all on public.ext_block_teaser, public.ext_sheet_reports, public.ext_installs, public.ext_views
  from anon, authenticated;
revoke all on sequence public.ext_views_id_seq from anon, authenticated;

-- Pilot: keys are issued to each person by hand, so we see whose key looked at what (T-0220, 23.11).
alter table public.ext_installs add column if not exists label text;

-- Base audit 24.11 (A1, A3): best precision class of the points behind the block, and how many metals did not fit in the four chips.
alter table public.ext_block_teaser add column if not exists more integer not null default 0;
alter table public.ext_block_teaser add column if not exists prec text;

-- Showcase of the full plugin on a few blocks (T-0220, 24.11): maps over the portal, rights, chat. Only keys with showcase=true.
create table if not exists public.ext_showcase (code text primary key, payload jsonb not null, ver bigint not null);
create table if not exists public.ext_chat (id bigserial primary key, at timestamptz not null default now(), day date not null default (now() at time zone 'Asia/Almaty')::date, key_hash text not null, code text not null, q text not null, status text not null default 'new', answer text, sources jsonb, answered_at timestamptz);
create index if not exists ext_chat_status on public.ext_chat (status, id);
create index if not exists ext_chat_key_day on public.ext_chat (key_hash, day);
alter table public.ext_installs add column if not exists showcase boolean not null default false;
alter table public.ext_showcase enable row level security;
alter table public.ext_chat enable row level security;
revoke all on public.ext_showcase, public.ext_chat from anon, authenticated;
revoke all on sequence public.ext_chat_id_seq from anon, authenticated;

-- Testers without daily limits (Erlan 24.11 for Mukhtar: unlimited, he is the tester). Set by hand per key.
alter table public.ext_installs add column if not exists nolimit boolean not null default false;
