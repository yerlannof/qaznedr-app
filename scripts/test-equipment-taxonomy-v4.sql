-- Isolated database with migrations up to 20261016_equipment_taxonomy_v4.sql applied.
-- psql -v ON_ERROR_STOP=1 -d <test db> -f scripts/test-equipment-taxonomy-v4.sql
begin;
insert into public.equipment_listings(id, owner_id, status, data) values
 ('bbbbbbbb-aaaa-4aaa-aaaa-000000000001','o','ACTIVE',jsonb_build_object('schemaVersion',2,'offerType','WANTED','category','staff','kind','DRILLER_HELPER','title','Нужен помощник','region','karagandy','contactName','A','phone','+77001112233','contactVisibility','PUBLIC','price',600000,'currency','KZT','priceUnit','MONTH')),
 ('bbbbbbbb-aaaa-4aaa-aaaa-000000000002','o','ACTIVE',jsonb_build_object('schemaVersion',2,'offerType','SALE','category','tools','kind','CORE_BITS','title','Коронки HQ','region','karagandy','contactName','A','phone','+77001112233','contactVisibility','PUBLIC'));
set local role service_role;
do $$ declare r jsonb; begin
 r := public.search_equipment_catalog(p_offer_type=>'WANTED');
 if (r->>'total')::int <> 1 then raise exception 'wanted %', r->>'total'; end if;
 r := public.search_equipment_catalog(p_category=>'staff', p_kind=>'DRILLER_HELPER');
 if (r->>'total')::int <> 1 then raise exception 'staff %', r->>'total'; end if;
 r := public.search_equipment_catalog(p_category=>'tools');
 if (r->>'total')::int <> 1 then raise exception 'tools %', r->>'total'; end if;
 r := public.search_equipment_catalog(p_category=>'staff', p_currency=>'KZT', p_price_unit=>'MONTH', p_sort=>'PRICE_ASC');
 if (r->>'total')::int <> 1 then raise exception 'month %', r->>'total'; end if;
 begin perform public.search_equipment_catalog(p_category=>'nope'); raise exception 'bad category accepted';
 exception when invalid_parameter_value then null; end;
end $$;
rollback;
\echo 'v4 checks passed'
