-- Isolated database with equipment migrations applied. Everything rolls back.
-- psql -v ON_ERROR_STOP=1 -d <test db> -f scripts/test-marketplace-engagement.sql
-- The migration commits itself (idempotent); the fixtures below roll back.
\ir ../supabase/migrations/20261016_marketplace_engagement.sql
begin;
insert into public.equipment_listings(id, owner_id, status, data) values
 ('cccccccc-aaaa-4aaa-aaaa-000000000001','o','ACTIVE',jsonb_build_object('schemaVersion',2,'offerType','WANTED','category','drill','title','Нужна буровая','region','karagandy','contactName','A','phone','+77001112233','contactVisibility','PUBLIC')),
 ('cccccccc-aaaa-4aaa-aaaa-000000000002','o','ACTIVE',jsonb_build_object('schemaVersion',2,'offerType','RENT','category','drill','title','Буровая','region','karagandy','contactName','A','phone','+77001112233','contactVisibility','PUBLIC')),
 ('cccccccc-aaaa-4aaa-aaaa-000000000003','o','DRAFT',jsonb_build_object('schemaVersion',2,'offerType','WANTED','category','drill','title','Черновик'));

set local role anon;
do $$ begin
  begin perform 1 from public.equipment_responses; raise exception 'anon read responses';
  exception when insufficient_privilege then null; end;
  begin perform public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000002','view'); raise exception 'anon event';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.marketplace_companies; raise exception 'anon companies';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.equipment_subscriptions; raise exception 'anon subs';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
do $$ declare r text; i int; begin
  -- stats
  if not public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000002','view') then raise exception 'view not recorded'; end if;
  perform public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000002','view');
  perform public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000002','contact');
  if (select views from public.equipment_listing_stats where listing_id='cccccccc-aaaa-4aaa-aaaa-000000000002') <> 2 then raise exception 'views'; end if;
  if (select contact_clicks from public.equipment_listing_stats where listing_id='cccccccc-aaaa-4aaa-aaaa-000000000002') <> 1 then raise exception 'clicks'; end if;
  if public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000003','view') then raise exception 'draft counted'; end if;
  begin perform public.record_equipment_listing_event('cccccccc-aaaa-4aaa-aaaa-000000000002','hack'); raise exception 'bad kind';
  exception when invalid_parameter_value then null; end;
  -- responses
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000001','Бур-Сервис','+77011234567','Есть УКБ-5, 300 тыс/смена',repeat('a',64));
  if r <> 'saved' then raise exception 'response %', r; end if;
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000001','Бур-Сервис','+77011234567','again',repeat('a',64));
  if r <> 'rate_limited' then raise exception 'same phone same day %', r; end if;
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000002','X','+77011234560','m',repeat('a',64));
  if r <> 'not_found' then raise exception 'offer accepted response %', r; end if;
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000003','X','+77011234560','m',repeat('a',64));
  if r <> 'not_found' then raise exception 'draft accepted response %', r; end if;
  for i in 1..4 loop
    r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000001','X','+7701123450'||i,'m',repeat('b',64));
  end loop;
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000001','X','+77011234599','m',repeat('b',64));
  if r <> 'saved' then raise exception 'fifth %', r; end if;
  r := public.submit_equipment_response('cccccccc-aaaa-4aaa-aaaa-000000000001','X','+77011234598','m',repeat('b',64));
  if r <> 'rate_limited' then raise exception 'ip limit %', r; end if;
  begin
    insert into public.equipment_responses(listing_id,name,phone,message,ip_hash) values ('cccccccc-aaaa-4aaa-aaaa-000000000001','X','87011234567','m',repeat('c',64));
    raise exception 'raw phone accepted';
  exception when check_violation then null; end;
  -- companies
  insert into public.marketplace_companies(owner_id, slug, name, website) values ('o','bur-servis','ТОО «Бур-Сервис»','https://bur.kz');
  if (select status from public.marketplace_companies where owner_id='o') <> 'PENDING' then raise exception 'company status'; end if;
  begin
    insert into public.marketplace_companies(owner_id, slug, name) values ('p','Bad Slug','X Y');
    raise exception 'bad slug';
  exception when check_violation then null; end;
  begin
    insert into public.marketplace_companies(owner_id, slug, name, website) values ('q','okslug','Name','http://x.kz');
    raise exception 'http website';
  exception when check_violation then null; end;
  -- subscriptions
  insert into public.equipment_subscriptions(email, filters, confirm_hash, unsubscribe_hash, ip_hash)
  values ('a@example.com', '{"category":"drill"}', repeat('1',64), repeat('2',64), repeat('3',64));
  begin
    insert into public.equipment_subscriptions(email, filters, confirm_hash, unsubscribe_hash, ip_hash)
    values ('a@example.com', '[]', repeat('4',64), repeat('5',64), repeat('3',64));
    raise exception 'array filters';
  exception when check_violation then null; end;
end $$;
reset role;
rollback;
\echo 'marketplace engagement: all checks passed'
