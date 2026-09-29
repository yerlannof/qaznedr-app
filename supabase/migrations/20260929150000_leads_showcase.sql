-- Geobase showcase cards (package qaznedr-showcase-v1) live in leads.showcase:
-- the public card contract with reviewed translations. sort_order keeps the
-- delivered display order. Both are public teaser columns (RLS unchanged:
-- anon still reads PUBLISHED rows only). No private data is stored here.
alter table public.leads add column if not exists showcase jsonb;
alter table public.leads add column if not exists sort_order int;
create index if not exists idx_leads_sort_order on public.leads(sort_order);
