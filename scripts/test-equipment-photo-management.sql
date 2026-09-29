-- Run with ON_ERROR_STOP against the isolated foundation + private-images fixture.
-- All fixtures and deliberately broad Storage policies are rolled back.
begin;
create function pg_temp.assert_true(ok boolean, message text) returns void
language plpgsql as $$ begin
  if ok is distinct from true then raise exception 'assertion failed: %',message; end if;
end $$;
create function pg_temp.expect_error(statement text, expected text) returns void
language plpgsql as $$ declare actual text; begin
  begin execute statement; exception when others then actual := sqlstate; end;
  if actual is distinct from expected then
    raise exception 'expected SQLSTATE %, got % for %',expected,actual,statement;
  end if;
end $$;

-- Missing functions must make the initial red run fail before fixtures mutate.
select pg_temp.assert_true(to_regprocedure('public.remove_equipment_image(uuid,text,integer,uuid)') is not null,'delete RPC exists');
select pg_temp.assert_true(to_regprocedure('public.reorder_equipment_images(uuid,text,integer,uuid[])') is not null,'reorder RPC exists');
select pg_temp.assert_true(to_regprocedure('public.equipment_moderation_images(uuid,integer)') is not null,'snapshot RPC exists');

do $$ declare r text; f text; begin
  foreach r in array array['anon','authenticated'] loop
    foreach f in array array[
      'public.remove_equipment_image(uuid,text,integer,uuid)',
      'public.reorder_equipment_images(uuid,text,integer,uuid[])',
      'public.equipment_moderation_images(uuid,integer)'] loop
      perform pg_temp.assert_true(not has_function_privilege(r,f,'EXECUTE'),r||' cannot execute '||f);
    end loop;
    perform pg_temp.assert_true(not has_table_privilege(r,'public.equipment_image_deletions','SELECT'),r||' cannot read deletion paths');
    perform pg_temp.assert_true(not has_table_privilege(r,'public.equipment_listing_images','DELETE'),r||' cannot delete attachment');
  end loop;
  perform pg_temp.assert_true((select relrowsecurity from pg_class where oid='public.equipment_image_deletions'::regclass),'queue has RLS');
  perform pg_temp.assert_true((select condeferrable and not condeferred from pg_constraint where conname='equipment_listing_images_listing_id_position_key'),'only position constraint deferrable, initially immediate');
end $$;
set local role anon;
select pg_temp.expect_error('select * from public.equipment_image_deletions','42501');
select pg_temp.expect_error('select public.equipment_moderation_images(null,1)','42501');
reset role;
set local role authenticated;
select pg_temp.expect_error('delete from public.equipment_listing_images','42501');
reset role;

set local role service_role;
do $$ declare
  l uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  owner text := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  ids uuid[] := array['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3']::uuid[];
  reply jsonb; before_events bigint; before_queue bigint; snapshot jsonb; i integer;
begin
  insert into public.equipment_listings(id,owner_id,status) values(l,owner,'ACTIVE');
  for i in 1..3 loop
    insert into storage.objects(bucket_id,name) values('equipment-images',l::text||'/'||ids[i]::text||'.webp');
    insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position)
      values(ids[i],l,l::text||'/'||ids[i]::text||'.webp',640,480,100,i-1);
  end loop;

  -- Identical order is a true no-op, including ACTIVE status and event count.
  reply := public.reorder_equipment_images(l,owner,1,ids);
  perform pg_temp.assert_true(reply=jsonb_build_object('revision',1,'status','ACTIVE'),'identical order reply');
  perform pg_temp.assert_true((select count(*)=0 from public.equipment_moderation_events where listing_id=l),'no-op creates no event');
  perform pg_temp.expect_error(format('select public.equipment_moderation_images(%L,1)',l),'P0002');

  -- Invalid full sets (omission, duplicate, foreign/null/multidimensional) are atomic.
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,ids[1:2]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,array[ids[1],ids[1],ids[3]]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,array[ids[1],ids[2],'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,array[ids[1],ids[2],null::uuid]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,null::uuid[])',l,owner),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,array[ids,ids]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,'wrong-owner',ids),'P0002');
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,1,%L)',l,owner,'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),'P0002');
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,1,%L)',l,'wrong-owner',ids[1]),'P0002');
  perform pg_temp.assert_true((select revision=1 and status='ACTIVE' from public.equipment_listings where id=l),'invalid attempts leave listing intact');
  perform pg_temp.assert_true((select count(*)=3 from public.equipment_listing_images where listing_id=l),'invalid attempts leave all images intact');

  -- Swap previously colliding unique positions; full resulting set is contiguous.
  reply := public.reorder_equipment_images(l,owner,1,array[ids[3],ids[1],ids[2]]);
  perform pg_temp.assert_true(reply=jsonb_build_object('revision',2,'status','PENDING_MODERATION'),'swap increments revision and requires moderation');
  perform pg_temp.assert_true((select array_agg(id order by position)=array[ids[3],ids[1],ids[2]] from public.equipment_listing_images where listing_id=l),'swap exact order');
  perform pg_temp.assert_true((select array_agg(position order by position)=array[0,1,2] from public.equipment_listing_images where listing_id=l),'swap contiguous positions');
  snapshot := public.equipment_moderation_images(l,2);
  perform pg_temp.assert_true((snapshot->>'revision')::integer=2 and jsonb_array_length(snapshot->'images')=3,'pending snapshot contains exact revision and photo set');
  perform pg_temp.assert_true(snapshot->'images'->0->>'id'=ids[3]::text,'snapshot ordered');
  perform pg_temp.expect_error(format('select public.equipment_moderation_images(%L,1)',l),'40001');
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,1,%L)',l,owner,ids[1]),'40001');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,1,%L::uuid[])',l,owner,ids),'40001');
  before_events := (select count(*) from public.equipment_moderation_events where listing_id=l);
  reply := public.reorder_equipment_images(l,owner,2,array[ids[3],ids[1],ids[2]]);
  perform pg_temp.assert_true((reply->>'revision')::integer=2 and before_events=(select count(*) from public.equipment_moderation_events where listing_id=l),'pending no-op preserves reviewed revision');

  -- Middle deletion atomically removes access, queues the confirmed path, compacts positions.
  reply := public.remove_equipment_image(l,owner,2,ids[1]);
  perform pg_temp.assert_true(reply=jsonb_build_object('revision',3,'status','PENDING_MODERATION'),'deletion revision');
  perform pg_temp.assert_true(not exists(select 1 from public.equipment_listing_images where id=ids[1]),'deleted attachment inaccessible');
  perform pg_temp.assert_true((select array_agg(id order by position)=array[ids[3],ids[2]] and array_agg(position order by position)=array[0,1] from public.equipment_listing_images where listing_id=l),'deletion compacts exact order');
  perform pg_temp.assert_true(exists(select 1 from public.equipment_image_deletions where image_id=ids[1] and listing_id=l and storage_path=l::text||'/'||ids[1]::text||'.webp'),'queue uses confirmed path');
  perform pg_temp.assert_true(exists(select 1 from storage.objects where bucket_id='equipment-images' and name=l::text||'/'||ids[1]::text||'.webp'),'no inline physical deletion');
  perform pg_temp.expect_error(format('select public.transition_equipment_listing(%L,%L,%L,2,%L,3,%L::jsonb,null,%L)',l,owner,'PENDING_MODERATION','ACTIVE','{}','env-admin:admin@example.test'),'40001');
  perform pg_temp.assert_true(jsonb_array_length(public.equipment_moderation_images(l,3)->'images')=2,'new snapshot excludes deletion');
  before_queue := (select count(*) from public.equipment_image_deletions);
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,3,%L)',l,owner,ids[1]),'P0002');
  perform pg_temp.assert_true(before_queue=(select count(*) from public.equipment_image_deletions),'repeated delete no duplicate queue');
  perform pg_temp.assert_true((select count(*)=2 from public.equipment_moderation_events where listing_id=l),'exactly two mutations/event pairs');
  perform pg_temp.assert_true((select previous_status='ACTIVE' and next_status='PENDING_MODERATION' and previous_revision=1 and next_revision=2 from public.equipment_moderation_events where listing_id=l and previous_revision=1),'audit captures active invalidation');

  perform public.transition_equipment_listing(l,owner,'PENDING_MODERATION',3,'ACTIVE',4,'{}',null,'env-admin:admin@example.test');
  reply := public.remove_equipment_image(l,owner,4,ids[3]);
  perform pg_temp.assert_true(reply=jsonb_build_object('revision',5,'status','PENDING_MODERATION'),'active deletion requires new moderation');
  perform public.transition_equipment_listing(l,owner,'PENDING_MODERATION',5,'ARCHIVED',6,'{}',null,owner);
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,6,%L)',l,owner,ids[2]),'40001');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,6,%L::uuid[])',l,owner,array[ids[2]]),'40001');
  perform pg_temp.expect_error(format('select public.equipment_moderation_images(%L,6)',l),'P0002');

  -- Empty complete list is a no-op. Bounds/null version and absent listing fail.
  insert into public.equipment_listings(id,owner_id,status) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner,'DRAFT');
  reply := public.reorder_equipment_images('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner,1,array[]::uuid[]);
  perform pg_temp.assert_true(reply=jsonb_build_object('revision',1,'status','DRAFT'),'empty set no-op');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,0,%L::uuid[])','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner,array[]::uuid[]),'22023');
  perform pg_temp.expect_error(format('select public.reorder_equipment_images(%L,%L,null,%L::uuid[])','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner,array[]::uuid[]),'22023');
  perform pg_temp.expect_error('select public.equipment_moderation_images(null,1)','22023');
  perform pg_temp.expect_error('select public.equipment_moderation_images(''ffffffff-ffff-4fff-8fff-ffffffffffff'',1)','P0002');
end $$;
reset role;

-- Inject a failure after image/queue writes to prove transaction rollback.
create function pg_temp.fail_photo_audit() returns trigger language plpgsql as $$ begin
  if new.listing_id='99999999-9999-4999-8999-999999999999'::uuid then
    raise exception 'fixture audit unavailable';
  end if;
  return new;
end $$;
create trigger fixture_photo_audit_failure before insert on public.equipment_moderation_events
  for each row execute function pg_temp.fail_photo_audit();
set local role service_role;
do $$ declare
  l uuid := '99999999-9999-4999-8999-999999999999';
  owner text := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  image uuid := '88888888-8888-4888-8888-888888888888';
begin
  insert into public.equipment_listings(id,owner_id,status) values(l,owner,'REJECTED');
  insert into storage.objects(bucket_id,name) values('equipment-images',l::text||'/'||image::text||'.webp');
  insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position)
    values(image,l,l::text||'/'||image::text||'.webp',100,100,3,0);
  perform pg_temp.expect_error(format('select public.remove_equipment_image(%L,%L,1,%L)',l,owner,image),'P0001');
  perform pg_temp.assert_true(exists(select 1 from public.equipment_listing_images where id=image),'audit failure restores deleted attachment');
  perform pg_temp.assert_true(not exists(select 1 from public.equipment_image_deletions where image_id=image),'audit failure rolls back queue');
  perform pg_temp.assert_true((select status='REJECTED' and revision=1 from public.equipment_listings where id=l),'audit failure preserves status/version');
end $$;
reset role;
drop trigger fixture_photo_audit_failure on public.equipment_moderation_events;
set local role service_role;
select pg_temp.assert_true(public.remove_equipment_image('99999999-9999-4999-8999-999999999999','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,'88888888-8888-4888-8888-888888888888')=jsonb_build_object('revision',2,'status','REJECTED'),'rejected deletion preserves rejected status');
reset role;
rollback;
