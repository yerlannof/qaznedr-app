-- Isolated database only. Every synthetic row is rolled back.
begin;
insert into public.equipment_listings(id, owner_id, status, data, updated_at)
select ('aaaaaaaa-aaaa-4aaa-aaaa-' || lpad(n::text,12,'0'))::uuid, 'private-owner',
 case when n = 4 then 'DRAFT' when n = 5 then 'ARCHIVED' else 'ACTIVE' end,
 jsonb_build_object('schemaVersion',2,'offerType',case when n=2 then 'SALE' else 'RENT' end,'category','drill',
 'title',case when n = 3 then 'Керновое бурение XY-1' else 'Drill XY-1' end,
 'region','Караганда','city','Караганда','availability','Now',
 'contactName','Hidden Seller','phone','+77001112233','contactVisibility','PRIVATE',
 'price',100*n,'currency','KZT','priceUnit',case when n=2 then 'ITEM' else 'HOUR' end,
 'site','SURFACE','chassis','TRACKED','trajectory','INCLINED',
 'machineYear',case when n=2 then 2018 else null end,'machineCondition',case when n=2 then 'USED' else null end,
 'capabilities',case when n = 1 then '[{"method":"CORE","depth":1200,"diameter":96},{"method":"RC","depth":200,"diameter":200}]'::jsonb
 when n = 2 then '[{"method":"CORE","depth":1000,"diameter":200,"coreSize":"HQ"}]'::jsonb
 else '[{"method":"CORE"}]'::jsonb end), '2026-10-03 00:00Z'::timestamptz
from generate_series(1,5) n;

set local role service_role;
do $$ declare result jsonb; begin
 result := public.search_equipment_catalog(p_method=>'CORE',p_depth=>900,p_diameter=>200);
 if (result->>'total')::int <> 1 or result#>>'{rows,0,id}' <> 'aaaaaaaa-aaaa-4aaa-aaaa-000000000002' then
   raise exception 'Cross-capability false match or exact diameter failure: %', result;
 end if;
 result := public.search_equipment_catalog(p_depth=>1000,p_diameter=>200);
 if (result->>'total')::int <> 1 then raise exception 'Unbound depth/diameter'; end if;
 result := public.search_equipment_catalog(p_core_size=>'HQ',p_depth=>1000,p_diameter=>96);
 if (result->>'total')::int <> 0 then raise exception 'Cross-core-size false match'; end if;
 result := public.search_equipment_catalog(p_core_size=>'HQ',p_chassis=>'TRACKED',p_site=>'SURFACE',p_trajectory=>'INCLINED',p_machine_condition=>'USED',p_min_year=>2010,p_max_year=>2020);
 if (result->>'total')::int <> 1 then raise exception 'Detailed attributes not filtered'; end if;
 result := public.search_equipment_catalog(p_method=>'RC',p_depth=>900);
 if (result->>'total')::int <> 0 then raise exception 'Cross-method false match'; end if;
 result := public.search_equipment_catalog();
 if (result->>'total')::int <> 3 then raise exception 'Non-ACTIVE visibility leak'; end if;
 result := public.search_equipment_catalog(p_tokens=>array['+77001112233']);
 if (result->>'total')::int <> 0 then raise exception 'Private contact searchable'; end if;
 result := public.search_equipment_catalog(p_tokens=>array['private-owner']);
 if (result->>'total')::int <> 0 then raise exception 'Private owner searchable'; end if;
 result := public.search_equipment_catalog(p_tokens=>array['core','бурение'],p_region=>'карагaнда');
 if (result->>'total')::int <> 0 then raise exception 'Unexpected region match'; end if;
 result := public.search_equipment_catalog(p_tokens=>array['core','бурение'],p_region=>'караганда');
 if (result->>'total')::int <> 1 then raise exception 'Method synonym/region not normalized'; end if;
 result := public.search_equipment_catalog(p_limit=>1,p_offset=>1);
 if (result->>'total')::int <> 3 or jsonb_array_length(result->'rows') <> 1
 or result#>>'{rows,0,id}' <> 'aaaaaaaa-aaaa-4aaa-aaaa-000000000002' then
   raise exception 'Pagination unstable';
 end if;
 result := public.search_equipment_catalog(p_limit=>1,p_offset=>100);
 if (result->>'total')::int <> 3 or jsonb_array_length(result->'rows') <> 0 then raise exception 'Empty page lost total'; end if;
 result := public.search_equipment_catalog(p_sort=>'PRICE_ASC',p_currency=>'KZT',p_price_unit=>'HOUR');
 if result#>>'{rows,0,id}' <> 'aaaaaaaa-aaaa-4aaa-aaaa-000000000001' then raise exception 'Price order wrong'; end if;
 begin
   perform public.search_equipment_catalog(p_limit=>1000);
   raise exception 'Unbounded query accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform public.search_equipment_catalog(p_sort=>'PRICE_ASC');
   raise exception 'Mixed-unit price comparison accepted';
 exception when invalid_parameter_value then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.search_equipment_catalog(); raise exception 'Anonymous DB RPC access';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 begin perform public.search_equipment_catalog(); raise exception 'Authenticated DB RPC access';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
