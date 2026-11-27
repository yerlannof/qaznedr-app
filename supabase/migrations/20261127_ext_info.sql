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
