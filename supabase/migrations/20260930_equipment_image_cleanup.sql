-- Closed cleanup foundation. Do not apply to production before activation review.
begin;

alter table public.equipment_image_deletions
  add column claim_token uuid,
  add column leased_until timestamptz,
  add column attempts integer not null default 0 check(attempts between 0 and 5),
  add column next_attempt_at timestamptz not null default now(),
  add column completed_at timestamptz,
  add constraint equipment_image_deletions_lease_pair
    check((claim_token is null)=(leased_until is null)),
  add constraint equipment_image_deletions_completed_unleased
    check(completed_at is null or claim_token is null);
create index equipment_image_deletions_claim_idx
  on public.equipment_image_deletions(next_attempt_at,created_at,image_id)
  where completed_at is null and attempts<5;

-- Both guards take the same parent lock before looking at the other table.
-- This also covers direct service-role INSERT/UPDATE, not just the app RPCs.
create function public.guard_equipment_image_attachment() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if current_setting('transaction_isolation')<>'read committed' then
    raise exception 'equipment image guards require READ COMMITTED' using errcode='0A000';
  end if;
  if tg_op='UPDATE' and (new.id,new.listing_id,new.storage_path)
    is distinct from (old.id,old.listing_id,old.storage_path) then
    raise exception 'equipment image identity is immutable' using errcode='23514';
  end if;
  perform 1 from public.equipment_listings where id=new.listing_id for update;
  perform pg_advisory_xact_lock(hashtextextended(new.id::text,0));
  if exists(select 1 from public.equipment_image_deletions
    where image_id=new.id or storage_path=new.storage_path) then
    raise exception 'equipment image path was queued for deletion' using errcode='23514';
  end if;
  return new;
end $$;
create trigger equipment_image_attachment_guard before insert or update
  on public.equipment_listing_images for each row
  execute function public.guard_equipment_image_attachment();

create function public.guard_equipment_image_deletion() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if current_setting('transaction_isolation')<>'read committed' then
    raise exception 'equipment image guards require READ COMMITTED' using errcode='0A000';
  end if;
  if tg_op='DELETE' then
    raise exception 'equipment image deletion tombstone is permanent' using errcode='23514';
  end if;
  if tg_op='UPDATE' then
    if (new.image_id,new.listing_id,new.storage_path,new.created_at)
      is distinct from (old.image_id,old.listing_id,old.storage_path,old.created_at)
      or (old.completed_at is not null and new.completed_at is distinct from old.completed_at)
      or new.attempts<old.attempts then
      raise exception 'equipment image deletion identity is immutable' using errcode='23514';
    end if;
    return new;
  end if;
  perform 1 from public.equipment_listings where id=new.listing_id for update;
  perform pg_advisory_xact_lock(hashtextextended(new.image_id::text,0));
  if exists(select 1 from public.equipment_listing_images
    where id=new.image_id or storage_path=new.storage_path) then
    raise exception 'attached equipment image cannot be queued' using errcode='23514';
  end if;
  return new;
end $$;
create trigger equipment_image_deletion_guard before insert or update or delete
  on public.equipment_image_deletions for each row
  execute function public.guard_equipment_image_deletion();

create function public.claim_equipment_image_deletions(p_limit integer,p_lease_seconds integer)
returns table(image_id uuid,listing_id uuid,storage_path text,claim_token uuid,attempts integer)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_limit is null or p_limit not between 1 and 20
    or p_lease_seconds is null or p_lease_seconds not between 30 and 300 then
    raise exception 'invalid equipment deletion claim' using errcode='22023';
  end if;
  return query
  with picked as materialized (
    select q.image_id from public.equipment_image_deletions q
    where q.completed_at is null and q.attempts<5
      and q.next_attempt_at<=clock_timestamp()
      and (q.leased_until is null or q.leased_until<=clock_timestamp())
    order by q.next_attempt_at,q.created_at,q.image_id
    limit p_limit for update skip locked
  )
  update public.equipment_image_deletions q
    set claim_token=gen_random_uuid(),
        leased_until=clock_timestamp()+make_interval(secs=>p_lease_seconds),
        attempts=q.attempts+1
    from picked where q.image_id=picked.image_id
    returning q.image_id,q.listing_id,q.storage_path,q.claim_token,q.attempts;
end $$;

create function public.ack_equipment_image_deletion(p_image_id uuid,p_claim_token uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare changed boolean;
begin
  if p_image_id is null or p_claim_token is null then return false; end if;
  update public.equipment_image_deletions
    set completed_at=clock_timestamp(),claim_token=null,leased_until=null
    where image_id=p_image_id and claim_token=p_claim_token
      and completed_at is null and leased_until>clock_timestamp()
    returning true into changed;
  return coalesce(changed,false);
end $$;

create function public.fail_equipment_image_deletion(p_image_id uuid,p_claim_token uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare changed boolean;
begin
  if p_image_id is null or p_claim_token is null then return false; end if;
  update public.equipment_image_deletions
    set claim_token=null,leased_until=null,
        next_attempt_at=clock_timestamp()+make_interval(secs=>least(3600,30*power(2,attempts)::integer))
    where image_id=p_image_id and claim_token=p_claim_token
      and completed_at is null and leased_until>clock_timestamp()
    returning true into changed;
  return coalesce(changed,false);
end $$;

revoke all on function public.guard_equipment_image_attachment() from public,anon,authenticated;
revoke all on function public.guard_equipment_image_deletion() from public,anon,authenticated;
revoke all on function public.claim_equipment_image_deletions(integer,integer) from public,anon,authenticated;
revoke all on function public.ack_equipment_image_deletion(uuid,uuid) from public,anon,authenticated;
revoke all on function public.fail_equipment_image_deletion(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_equipment_image_deletions(integer,integer) to service_role;
grant execute on function public.ack_equipment_image_deletion(uuid,uuid) to service_role;
grant execute on function public.fail_equipment_image_deletion(uuid,uuid) to service_role;
commit;
