-- Closed equipment photos; apply only after identity/profile/storage launch review.
create table if not exists public.equipment_listing_images (
  id uuid primary key,
  listing_id uuid not null references public.equipment_listings(id),
  storage_path text not null unique,
  width integer not null check(width between 1 and 1600),
  height integer not null check(height between 1 and 1600),
  bytes integer not null check(bytes between 1 and 3145728),
  position integer not null check(position between 0 and 7),
  created_at timestamptz not null default now(),
  unique(listing_id, position),
  check(storage_path = listing_id::text || '/' || id::text || '.webp')
);
alter table public.equipment_listing_images enable row level security;
revoke all on public.equipment_listing_images from public, anon, authenticated;
grant select, insert on public.equipment_listing_images to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('equipment-images','equipment-images',false,3145728,array['image/webp'])
on conflict(id) do update set public=false, file_size_limit=3145728, allowed_mime_types=array['image/webp'];

-- Restrictive policies combine with AND. Existing broad permissive policies must
-- not allow browser uploads/downloads/deletes in this dedicated private bucket.
drop policy if exists equipment_images_server_only on storage.objects;
create policy equipment_images_server_only on storage.objects as restrictive
for all to anon, authenticated
using(bucket_id <> 'equipment-images') with check(bucket_id <> 'equipment-images');

create or replace function public.attach_equipment_image(
  p_listing_id uuid,
  p_owner_id text,
  p_expected_revision integer,
  p_image_id uuid,
  p_storage_path text,
  p_width integer,
  p_height integer,
  p_bytes integer
) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp
as $$
declare
  listing public.equipment_listings;
  image public.equipment_listing_images;
  next_position integer;
  next_status text;
begin
  select * into listing from public.equipment_listings where id=p_listing_id for update;
  if not found or listing.owner_id is distinct from p_owner_id then
    raise exception 'equipment listing not found' using errcode='P0002';
  end if;
  if listing.revision is distinct from p_expected_revision or listing.status='ARCHIVED' then
    raise exception 'equipment listing changed' using errcode='40001';
  end if;
  if p_expected_revision is null or p_expected_revision < 1 or p_expected_revision > 2147483646
    or p_image_id is null
    or p_storage_path is distinct from p_listing_id::text || '/' || p_image_id::text || '.webp'
    or p_width is null or p_width not between 1 and 1600
    or p_height is null or p_height not between 1 and 1600
    or p_bytes is null or p_bytes not between 1 and 3145728 then
    raise exception 'invalid equipment image' using errcode='22023';
  end if;
  select coalesce(max(position)+1,0) into next_position
    from public.equipment_listing_images where listing_id=p_listing_id;
  if next_position >= 8 then
    raise exception 'equipment image limit' using errcode='54000';
  end if;
  if not exists(select 1 from storage.objects where bucket_id='equipment-images' and name=p_storage_path) then
    raise exception 'equipment image object unavailable' using errcode='22023';
  end if;
  insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position)
    values(p_image_id,p_listing_id,p_storage_path,p_width,p_height,p_bytes,next_position)
    returning * into image;
  next_status := case when listing.status='ACTIVE' then 'PENDING_MODERATION' else listing.status end;
  update public.equipment_listings set status=next_status,revision=listing.revision+1,updated_at=now()
    where id=p_listing_id;
  insert into public.equipment_moderation_events
    (listing_id,actor_id,previous_status,next_status,previous_revision,next_revision)
    values(p_listing_id,p_owner_id,listing.status,next_status,listing.revision,listing.revision+1);
  return jsonb_build_object('image',to_jsonb(image),'revision',listing.revision+1,'status',next_status);
end;
$$;
revoke all on function public.attach_equipment_image(uuid,text,integer,uuid,text,integer,integer,integer)
  from public,anon,authenticated;
grant execute on function public.attach_equipment_image(uuid,text,integer,uuid,text,integer,integer,integer)
  to service_role;
