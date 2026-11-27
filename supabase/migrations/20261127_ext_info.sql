-- «Tap any block» (T-0220, 27.11): a block report with pages for showcase keys only.
-- Erlan 27.11 (button via TASKS): «Да, только ключам показа (Рекомендуется)» — object names, fund report numbers and quotes
-- are served only to installs with showcase=true; the public panel and other keys stay anonymous.
-- Objects keep lat/lon server-side for the distance search; the API returns only the distance, never the point.
create table if not exists public.ext_info_objects (
  oid text primary key,
  lat double precision not null,
  lon double precision not null,
  payload jsonb not null,
  ver bigint not null
);
create index if not exists ext_info_objects_latlon on public.ext_info_objects (lat, lon);

create table if not exists public.ext_info_sheets (
  sheet text primary key,
  payload jsonb not null,
  ver bigint not null
);

alter table public.ext_info_objects enable row level security;
alter table public.ext_info_sheets enable row level security;
revoke all on public.ext_info_objects, public.ext_info_sheets from anon, authenticated;

-- Coverage light (T-0220 p.3, 27.11): «изученность по нашей базе», not prospectivity. Data: BULATPAGE scripts/block_coverage.py
-- (coverage_light.tsv), a block row wins over its sheet row. No volume numbers inside; served with the showcase report.
create table if not exists public.ext_coverage (
  code text primary key,
  level text not null,
  light text not null check (light in ('green', 'yellow', 'grey')),
  why_ru text not null default '',
  why_zh text not null default '',
  order_n integer not null default 0,
  page text not null default '',
  ver bigint not null
);
alter table public.ext_coverage enable row level security;
revoke all on public.ext_coverage from anon, authenticated;
