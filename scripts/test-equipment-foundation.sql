-- Run with psql against an isolated database after the migration. Rolls back all rows.
begin;

set local role anon;
do $$ begin
  begin
    perform 1 from public.equipment_listings;
    raise exception 'anon SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.equipment_listings set status = 'ACTIVE';
    raise exception 'anon UPDATE unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.transition_equipment_listing(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', 'DRAFT', 1,
      'PENDING_MODERATION', 2, '{}'::jsonb, null, 'owner-smoke');
    raise exception 'anon RPC unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
do $$ begin
  begin
    perform 1 from public.equipment_listings;
    raise exception 'authenticated SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.equipment_listings set status = 'ACTIVE';
    raise exception 'authenticated UPDATE unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.transition_equipment_listing(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', 'DRAFT', 1,
      'PENDING_MODERATION', 2, '{}'::jsonb, null, 'owner-smoke');
    raise exception 'authenticated RPC unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role service_role;
insert into public.equipment_listings (id, owner_id, data)
values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', '{}'::jsonb);

do $$ declare result public.equipment_listings; begin
  result := public.transition_equipment_listing(
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', 'DRAFT', 1,
    'PENDING_MODERATION', 2, '{}'::jsonb, null, 'owner-smoke');
  if result.status <> 'PENDING_MODERATION' then
    raise exception 'transition returned unexpected wire shape';
  end if;
end $$;

do $$ begin
  begin
    perform public.transition_equipment_listing(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', 'DRAFT', 1,
      'PENDING_MODERATION', 2, '{}'::jsonb, null, 'owner-smoke');
    raise exception 'stale transition unexpectedly succeeded';
  exception when sqlstate '40001' then null;
  end;
  if (select revision from public.equipment_listings where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 2 then
    raise exception 'revision changed after stale transition';
  end if;
  if (select count(*) from public.equipment_moderation_events where listing_id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 1 then
    raise exception 'stale transition inserted event';
  end if;
end $$;

do $$ declare result public.equipment_listings; begin
  result := public.transition_equipment_listing(
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'owner-smoke', 'PENDING_MODERATION', 2,
    'REJECTED', 3, '{}'::jsonb, 'Incomplete evidence', 'moderator-smoke');
  if result.status <> 'REJECTED' then
    raise exception 'moderation returned unexpected wire shape';
  end if;
end $$;
do $$ begin
  if (select reason from public.equipment_moderation_events
      where listing_id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' and next_status = 'REJECTED')
      is distinct from 'Incomplete evidence' then
    raise exception 'rejection reason missing from event';
  end if;
end $$;

rollback;
