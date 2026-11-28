-- Gold showcase v1 (APPSALE T-0206, Erlan 28.11 via TASKS «После 51 проверки»): 179 gold cards for signed-in users.
-- The cards live in public.leads so requests, manual grants and the access log are reused as they are.
--   * status 'MEMBERS': not PUBLISHED, so the anon RLS policy, the public lists, sitemap and /api/leads never see them;
--     the server reads them with the service role for signed-in users only.
--   * tier 'GOLD_V1' + level 1–5 (price grid of the card).
--   * leads.gold: the open part of the card (no name, sheet, degrees or holders — the APPSALE export gate checks it).
--   * lead_private.paid_md: the paid part, read only after an ACTIVE entitlement (lib/gold/cards.ts → readGoldPaid).
--   * bucket gold-crops (private): scan crops, served only through /api/gold/<code>/crop/<file> after the same check.
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('DRAFT','PUBLISHED','MEMBERS','SOLD','ARCHIVED'));
alter table public.leads drop constraint if exists leads_tier_check;
alter table public.leads add constraint leads_tier_check
  check (tier in ('TIER1_PLACER','TIER2_BOMB','GOLD_V1'));
alter table public.leads add column if not exists level smallint check (level between 1 and 5);
alter table public.leads add column if not exists gold jsonb;
alter table public.lead_private add column if not exists paid_md text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('gold-crops', 'gold-crops', false, 5242880)
on conflict (id) do nothing;
