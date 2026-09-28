-- Closed equipment catalogue. NextAuth identities are text IDs; no auth.users FK.
create table if not exists public.equipment_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null check (length(owner_id) between 1 and 160),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PENDING_MODERATION', 'ACTIVE', 'REJECTED', 'ARCHIVED')),
  revision integer not null default 1 check (revision > 0),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 65536),
  moderation_notes text check (moderation_notes is null or length(moderation_notes) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_listings_owner_updated_idx on public.equipment_listings (owner_id, updated_at desc);
create index if not exists equipment_listings_pending_updated_idx on public.equipment_listings (updated_at)
  where status = 'PENDING_MODERATION';

create table if not exists public.equipment_moderation_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.equipment_listings(id),
  actor_id text not null check (length(actor_id) between 1 and 160),
  previous_status text not null,
  next_status text not null,
  previous_revision integer not null,
  next_revision integer not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists equipment_moderation_events_listing_idx on public.equipment_moderation_events (listing_id, created_at desc);

alter table public.equipment_listings enable row level security;
alter table public.equipment_moderation_events enable row level security;
revoke all on public.equipment_listings from public, anon, authenticated;
revoke all on public.equipment_moderation_events from public, anon, authenticated;
revoke all on sequence public.equipment_moderation_events_id_seq from public, anon, authenticated;
grant select, insert, update on public.equipment_listings to service_role;
grant select, insert on public.equipment_moderation_events to service_role;
grant usage, select on sequence public.equipment_moderation_events_id_seq to service_role;

-- SECURITY INVOKER: only the service role has table and function privileges.
-- Row lock and revision comparison prevent a moderation decision racing an edit.
create or replace function public.transition_equipment_listing(
  p_id uuid,
  p_expected_owner_id text,
  p_expected_status text,
  p_expected_revision integer,
  p_next_status text,
  p_next_revision integer,
  p_next_data jsonb,
  p_next_moderation_notes text,
  p_actor_id text
) returns public.equipment_listings
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  current_row public.equipment_listings;
  updated_row public.equipment_listings;
  moderator_transition boolean;
begin
  select * into current_row from public.equipment_listings where id = p_id for update;
  if not found or current_row.owner_id is distinct from p_expected_owner_id
    or current_row.status is distinct from p_expected_status
    or current_row.revision is distinct from p_expected_revision then
    raise exception 'equipment listing conflict' using errcode = '40001';
  end if;

  if p_next_revision is distinct from current_row.revision + 1
    or p_next_status not in ('DRAFT', 'PENDING_MODERATION', 'ACTIVE', 'REJECTED', 'ARCHIVED')
    or p_next_data is null or jsonb_typeof(p_next_data) <> 'object'
    or pg_column_size(p_next_data) > 65536
    or nullif(btrim(p_actor_id), '') is null then
    raise exception 'invalid equipment transition' using errcode = '22023';
  end if;

  moderator_transition := current_row.status = 'PENDING_MODERATION'
    and p_next_status in ('ACTIVE', 'REJECTED');
  if moderator_transition then
    if p_actor_id = current_row.owner_id then
      raise exception 'moderator must differ from owner' using errcode = '22023';
    end if;
  elsif p_actor_id <> current_row.owner_id then
    raise exception 'owner required' using errcode = '22023';
  end if;

  if not (
    (current_row.status = 'DRAFT' and p_next_status in ('DRAFT', 'PENDING_MODERATION', 'ARCHIVED')) or
    (current_row.status = 'REJECTED' and p_next_status in ('REJECTED', 'PENDING_MODERATION', 'ARCHIVED')) or
    (current_row.status = 'PENDING_MODERATION' and p_next_status in ('PENDING_MODERATION', 'ACTIVE', 'REJECTED', 'ARCHIVED')) or
    (current_row.status = 'ACTIVE' and p_next_status in ('PENDING_MODERATION', 'ARCHIVED'))
  ) then
    raise exception 'invalid equipment transition' using errcode = '22023';
  end if;
  if p_next_status = 'REJECTED' and nullif(btrim(p_next_moderation_notes), '') is null then
    raise exception 'rejection reason required' using errcode = '22023';
  end if;

  update public.equipment_listings
  set status = p_next_status, revision = p_next_revision, data = p_next_data,
      moderation_notes = p_next_moderation_notes, updated_at = now()
  where id = p_id returning * into updated_row;
  insert into public.equipment_moderation_events
    (listing_id, actor_id, previous_status, next_status, previous_revision, next_revision, reason)
  values (p_id, p_actor_id, current_row.status, p_next_status, current_row.revision, p_next_revision,
    case when p_next_status = 'REJECTED' then p_next_moderation_notes else null end);
  return updated_row;
end;
$$;

revoke all on function public.transition_equipment_listing(uuid,text,text,integer,text,integer,jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.transition_equipment_listing(uuid,text,text,integer,text,integer,jsonb,text,text)
  to service_role;
