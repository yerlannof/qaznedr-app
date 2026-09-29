-- Closed foundation only. This migration does not launch the catalogue.
begin;

-- A single ordered UPDATE may swap two positions. Validate uniqueness before
-- returning from each RPC; leave the constraint immediate for other callers.
alter table public.equipment_listing_images
  drop constraint equipment_listing_images_listing_id_position_key;
alter table public.equipment_listing_images
  add constraint equipment_listing_images_listing_id_position_key
  unique(listing_id,position) deferrable initially immediate;
grant update,delete on public.equipment_listing_images to service_role;

-- Logical deletion revokes proxy access immediately. Keep an exact private
-- path for a separately verified cleanup worker; never delete bytes inline
-- after an RPC whose commit outcome the HTTP server may not know.
create table if not exists public.equipment_image_deletions (
  image_id uuid primary key,
  listing_id uuid not null references public.equipment_listings(id),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  check(storage_path=listing_id::text||'/'||image_id::text||'.webp')
);
create index if not exists equipment_image_deletions_created_idx
  on public.equipment_image_deletions(created_at);
alter table public.equipment_image_deletions enable row level security;
revoke all on public.equipment_image_deletions from public,anon,authenticated;
grant select,insert on public.equipment_image_deletions to service_role;

create or replace function public.remove_equipment_image(
  p_listing_id uuid,p_owner_id text,p_expected_revision integer,p_image_id uuid
) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp
as $$ declare
  listing public.equipment_listings;
  image public.equipment_listing_images;
  next_status text;
begin
  if p_listing_id is null or p_image_id is null or p_expected_revision is null
    or p_expected_revision not between 1 and 2147483646 then
    raise exception 'invalid equipment image deletion' using errcode='22023';
  end if;
  select * into listing from public.equipment_listings where id=p_listing_id for update;
  if not found or listing.owner_id is distinct from p_owner_id then
    raise exception 'equipment listing not found' using errcode='P0002';
  end if;
  if listing.revision is distinct from p_expected_revision or listing.status='ARCHIVED' then
    raise exception 'equipment listing changed' using errcode='40001';
  end if;
  select * into image from public.equipment_listing_images where id=p_image_id and listing_id=p_listing_id;
  if not found then raise exception 'equipment image not found' using errcode='P0002'; end if;

  set constraints public.equipment_listing_images_listing_id_position_key deferred;
  delete from public.equipment_listing_images where id=image.id;
  update public.equipment_listing_images set position=ordered.position
    from (select id,(row_number() over(order by position)-1)::integer as position
      from public.equipment_listing_images where listing_id=p_listing_id) ordered
    where equipment_listing_images.id=ordered.id;
  set constraints public.equipment_listing_images_listing_id_position_key immediate;
  insert into public.equipment_image_deletions(image_id,listing_id,storage_path)
    values(image.id,image.listing_id,image.storage_path);
  next_status := case when listing.status='ACTIVE' then 'PENDING_MODERATION' else listing.status end;
  update public.equipment_listings set status=next_status,revision=listing.revision+1,updated_at=now()
    where id=p_listing_id;
  insert into public.equipment_moderation_events
    (listing_id,actor_id,previous_status,next_status,previous_revision,next_revision)
    values(p_listing_id,p_owner_id,listing.status,next_status,listing.revision,listing.revision+1);
  return jsonb_build_object('revision',listing.revision+1,'status',next_status);
end $$;

create or replace function public.reorder_equipment_images(
  p_listing_id uuid,p_owner_id text,p_expected_revision integer,p_image_ids uuid[]
) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp
as $$ declare
  listing public.equipment_listings;
  current_ids uuid[];
  next_status text;
begin
  if p_listing_id is null or p_expected_revision is null
    or p_expected_revision not between 1 and 2147483646 or p_image_ids is null
    or cardinality(p_image_ids)>8 then
    raise exception 'invalid equipment image order' using errcode='22023';
  end if;
  if cardinality(p_image_ids)>0 then
    if array_ndims(p_image_ids)<>1 or array_lower(p_image_ids,1)<>1 then
      raise exception 'invalid equipment image order' using errcode='22023';
    end if;
    if array_position(p_image_ids,null) is not null
      or cardinality(p_image_ids)<>(select count(distinct id) from unnest(p_image_ids) as ids(id)) then
      raise exception 'invalid equipment image order' using errcode='22023';
    end if;
  end if;
  select * into listing from public.equipment_listings where id=p_listing_id for update;
  if not found or listing.owner_id is distinct from p_owner_id then
    raise exception 'equipment listing not found' using errcode='P0002';
  end if;
  if listing.revision is distinct from p_expected_revision or listing.status='ARCHIVED' then
    raise exception 'equipment listing changed' using errcode='40001';
  end if;
  select coalesce(array_agg(id order by position),array[]::uuid[]) into current_ids
    from public.equipment_listing_images where listing_id=p_listing_id;
  if cardinality(p_image_ids)<>cardinality(current_ids)
    or not(p_image_ids @> current_ids and p_image_ids <@ current_ids) then
    raise exception 'complete equipment image set required' using errcode='22023';
  end if;
  if p_image_ids=current_ids then
    return jsonb_build_object('revision',listing.revision,'status',listing.status);
  end if;

  set constraints public.equipment_listing_images_listing_id_position_key deferred;
  update public.equipment_listing_images set position=ordered.position
    from (select id,(ordinality-1)::integer as position
      from unnest(p_image_ids) with ordinality as ids(id,ordinality)) ordered
    where equipment_listing_images.id=ordered.id and listing_id=p_listing_id;
  set constraints public.equipment_listing_images_listing_id_position_key immediate;
  next_status := case when listing.status='ACTIVE' then 'PENDING_MODERATION' else listing.status end;
  update public.equipment_listings set status=next_status,revision=listing.revision+1,updated_at=now()
    where id=p_listing_id;
  insert into public.equipment_moderation_events
    (listing_id,actor_id,previous_status,next_status,previous_revision,next_revision)
    values(p_listing_id,p_owner_id,listing.status,next_status,listing.revision,listing.revision+1);
  return jsonb_build_object('revision',listing.revision+1,'status',next_status);
end $$;

create or replace function public.equipment_moderation_images(
  p_listing_id uuid,p_expected_revision integer
) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp
as $$ declare listing public.equipment_listings; images jsonb; begin
  if p_listing_id is null or p_expected_revision is null or p_expected_revision<1 then
    raise exception 'invalid equipment image snapshot' using errcode='22023';
  end if;
  -- Every photo mutation locks this parent first, so the rows below belong to
  -- one revision. This lock lasts until the calling transaction finishes.
  select * into listing from public.equipment_listings where id=p_listing_id for share;
  if not found or listing.status<>'PENDING_MODERATION' then
    raise exception 'pending equipment listing not found' using errcode='P0002';
  end if;
  if listing.revision is distinct from p_expected_revision then
    raise exception 'equipment listing changed' using errcode='40001';
  end if;
  select coalesce(jsonb_agg(to_jsonb(image) order by image.position),'[]'::jsonb) into images
    from public.equipment_listing_images image where listing_id=p_listing_id;
  return jsonb_build_object('revision',listing.revision,'images',images);
end $$;

revoke all on function public.remove_equipment_image(uuid,text,integer,uuid) from public,anon,authenticated;
revoke all on function public.reorder_equipment_images(uuid,text,integer,uuid[]) from public,anon,authenticated;
revoke all on function public.equipment_moderation_images(uuid,integer) from public,anon,authenticated;
grant execute on function public.remove_equipment_image(uuid,text,integer,uuid) to service_role;
grant execute on function public.reorder_equipment_images(uuid,text,integer,uuid[]) to service_role;
grant execute on function public.equipment_moderation_images(uuid,integer) to service_role;
commit;
