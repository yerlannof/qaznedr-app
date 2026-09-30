-- Run only against a disposable database with foundation, private-images,
-- photo-management and cleanup migrations applied. All fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, message text) returns void
language plpgsql as $$ begin if ok is distinct from true then raise exception 'assertion failed: %',message; end if; end $$;
create function pg_temp.expect_error(statement text, expected text) returns void
language plpgsql as $$ declare actual text; begin
  begin execute statement; exception when others then actual := sqlstate; end;
  if actual is distinct from expected then raise exception 'expected %, got %: %',expected,actual,statement; end if;
end $$;

select pg_temp.assert_true(to_regprocedure('public.claim_equipment_image_deletions(integer,integer)') is not null,'claim RPC exists');
select pg_temp.assert_true(to_regprocedure('public.ack_equipment_image_deletion(uuid,uuid)') is not null,'ack RPC exists');
select pg_temp.assert_true(to_regprocedure('public.fail_equipment_image_deletion(uuid,uuid)') is not null,'fail RPC exists');
do $$ declare role_name text; signature text; begin
  foreach role_name in array array['anon','authenticated'] loop
    foreach signature in array array['public.claim_equipment_image_deletions(integer,integer)','public.ack_equipment_image_deletion(uuid,uuid)','public.fail_equipment_image_deletion(uuid,uuid)'] loop
      perform pg_temp.assert_true(not has_function_privilege(role_name,signature,'EXECUTE'),role_name||' cannot run '||signature);
    end loop;
    perform pg_temp.assert_true(not has_table_privilege(role_name,'public.equipment_image_deletions','SELECT'),role_name||' cannot read queue');
  end loop;
  perform pg_temp.assert_true((select relrowsecurity from pg_class where oid='public.equipment_image_deletions'::regclass),'queue RLS');
end $$;
set local role service_role;
select pg_temp.expect_error('select public.claim_equipment_image_deletions(0,60)','22023');
select pg_temp.expect_error('select public.claim_equipment_image_deletions(21,60)','22023');
select pg_temp.expect_error('select public.claim_equipment_image_deletions(1,29)','22023');
select pg_temp.expect_error('select public.claim_equipment_image_deletions(1,301)','22023');

do $$ declare
  l uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  owner text := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  id1 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  id2 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  token1 uuid; row1 record;
begin
  insert into public.equipment_listings(id,owner_id,status) values(l,owner,'DRAFT');
  insert into storage.objects(bucket_id,name) values
    ('equipment-images',l::text||'/'||id1::text||'.webp'),
    ('equipment-images',l::text||'/'||id2::text||'.webp');
  insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position) values
    (id1,l,l::text||'/'||id1::text||'.webp',100,100,3,0),
    (id2,l,l::text||'/'||id2::text||'.webp',100,100,3,1);
  perform pg_temp.expect_error(format('insert into public.equipment_image_deletions(image_id,listing_id,storage_path) values(%L,%L,%L)',id1,l,l::text||'/'||id1::text||'.webp'),'23514');
  perform public.remove_equipment_image(l,owner,1,id1);
  perform public.remove_equipment_image(l,owner,2,id2);
  perform pg_temp.expect_error(format('insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position) values(%L,%L,%L,100,100,3,0)',id1,l,l::text||'/'||id1::text||'.webp'),'23514');
  perform pg_temp.expect_error(format('update public.equipment_image_deletions set storage_path=%L where image_id=%L','other',id1),'42501');
  select * into row1 from public.claim_equipment_image_deletions(1,60);
  token1 := row1.claim_token;
  perform set_config('qaznedr.cleanup_old_token',token1::text,true);
  perform pg_temp.assert_true(row1.image_id=id1 and row1.storage_path=l::text||'/'||id1::text||'.webp' and row1.attempts=1,'first exact claim');
  perform pg_temp.assert_true((select count(*)=1 from public.claim_equipment_image_deletions(20,60)),'leased job skipped');
  perform pg_temp.assert_true(not public.ack_equipment_image_deletion(id1,'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),'wrong token cannot ack');
  perform pg_temp.assert_true(not public.fail_equipment_image_deletion(id1,'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),'wrong token cannot fail');
  perform pg_temp.assert_true(public.fail_equipment_image_deletion(id1,token1),'valid fail');
  perform pg_temp.assert_true((select completed_at is null from public.equipment_image_deletions where image_id=id1),'fail does not complete');
  perform pg_temp.assert_true((select attempts=1 and completed_at is null from public.equipment_image_deletions where image_id=id1),'failed task remains');
  perform set_config('qaznedr.cleanup_expired_token',
    (select claim_token::text from public.equipment_image_deletions where image_id=id2),true);
end $$;
reset role;
-- Fixture owner advances the retry clock, then service role reclaims it.
update public.equipment_image_deletions set next_attempt_at=now()-interval '1 second'
  where image_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
update public.equipment_image_deletions set leased_until=now()-interval '1 second'
  where image_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
select pg_temp.expect_error($sql$update public.equipment_image_deletions
  set storage_path='wrong' where image_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'$sql$,'23514');
set local role service_role;
do $$ declare id1 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  id2 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  l uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  old_token uuid; new_token uuid; expired_token uuid; replacement_token uuid; count_before bigint;
begin
  old_token := current_setting('qaznedr.cleanup_old_token')::uuid;
  select claim_token into new_token from public.claim_equipment_image_deletions(1,60) where image_id=id1;
  perform pg_temp.assert_true(new_token is not null and new_token<>old_token,'retry has fresh token');
  perform pg_temp.assert_true(not public.ack_equipment_image_deletion(id1,old_token),'stale token fenced');
  perform pg_temp.assert_true(public.ack_equipment_image_deletion(id1,new_token),'current token acks');
  perform pg_temp.assert_true((select completed_at is not null from public.equipment_image_deletions where image_id=id1),'completed tombstone kept');
  perform pg_temp.assert_true(not public.ack_equipment_image_deletion(id1,new_token),'completed cannot ack again');
  perform pg_temp.expect_error(format('insert into public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position) values(%L,%L,%L,100,100,3,0)',id1,l,l::text||'/'||id1::text||'.webp'),'23514');
  expired_token := current_setting('qaznedr.cleanup_expired_token')::uuid;
  select claim_token into replacement_token from public.claim_equipment_image_deletions(1,60) where image_id=id2;
  perform pg_temp.assert_true(replacement_token is not null and replacement_token<>expired_token,'expired lease reclaimed');
  perform pg_temp.assert_true(not public.fail_equipment_image_deletion(id2,expired_token),'expired token cannot fail new lease');
  perform pg_temp.assert_true(public.ack_equipment_image_deletion(id2,replacement_token),'reclaimed task acked');
  count_before := (select count(*) from public.equipment_image_deletions);
  perform pg_temp.assert_true((select count(*)=0 from public.claim_equipment_image_deletions(20,60)),'completed excluded');
  perform pg_temp.assert_true((select count(*) from public.equipment_image_deletions)=count_before,'claim preserves tombstones');
end $$;
reset role;
insert into public.equipment_image_deletions(image_id,listing_id,storage_path,attempts)
  values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3.webp',5);
set local role service_role;
select pg_temp.assert_true((select count(*)=0 from public.claim_equipment_image_deletions(20,60)),'attempt cap requires manual review');
reset role;
insert into public.equipment_image_deletions(image_id,listing_id,storage_path)
  values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4.webp');
savepoint before_claim;
set local role service_role;
select pg_temp.assert_true((select count(*)=1 from public.claim_equipment_image_deletions(1,60)),'rollback fixture claimed');
rollback to savepoint before_claim;
select pg_temp.assert_true((select attempts=0 and claim_token is null
  from public.equipment_image_deletions where image_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'),
  'rolled-back claim restores ownership');
rollback;
