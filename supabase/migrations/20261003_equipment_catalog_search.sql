-- Closed catalogue foundation. Apply only after the separate launch review.
-- Service-only RPC: the HTTP boundary still validates and projects every row.
create or replace function public.equipment_search_normalize(value text)
returns text language sql immutable parallel safe set search_path = public, pg_temp as $$
 select coalesce(string_agg(case word
   when 'керновое' then 'core' when 'керновой' then 'core'
   when 'колонковое' then 'core' when 'coring' then 'core'
   when 'шнековое' then 'auger' when 'шнековый' then 'auger'
   when 'пневмоударное' then 'dth' when 'соник' then 'sonic'
   else word end, ' ' order by position), '')
 from regexp_split_to_table(trim(replace(lower(normalize(coalesce(value,''), NFKC)), 'ё', 'е')), '\s+')
 with ordinality as words(word, position);
$$;

create or replace function public.equipment_search_number(value jsonb, field text)
returns numeric language sql immutable parallel safe set search_path = public, pg_temp as $$
 select case when jsonb_typeof(value->field) = 'number' then (value->>field)::numeric else null end;
$$;

create index if not exists equipment_listings_active_updated_idx
 on public.equipment_listings(updated_at desc, id) where status = 'ACTIVE';

create or replace function public.search_equipment_catalog(
 p_offer_type text default null,
 p_category text default null,
 p_region text default null,
 p_method text default null,
 p_purpose text default null,
 p_core_size text default null,
 p_site text default null,
 p_trajectory text default null,
 p_chassis text default null,
 p_machine_condition text default null,
 p_min_year integer default null,
 p_max_year integer default null,
 p_depth numeric default null,
 p_diameter numeric default null,
 p_bucket numeric default null,
 p_mass numeric default null,
 p_pressure numeric default null,
 p_flow numeric default null,
 p_payload numeric default null,
 p_operator boolean default null,
 p_delivery boolean default null,
 p_currency text default null,
 p_price_unit text default null,
 p_shift_hours numeric default null,
 p_sort text default 'NEWEST',
 p_tokens text[] default '{}',
 p_limit integer default 20,
 p_offset integer default 0
) returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare result jsonb;
begin
 if p_limit is null or p_limit not between 1 and 50 or p_offset is null or p_offset not between 0 and 49950
 or p_sort is null or p_sort not in ('NEWEST','PRICE_ASC')
 or (p_sort = 'PRICE_ASC' and (p_currency is null or p_price_unit is null
     or (p_price_unit = 'SHIFT' and p_shift_hours is null)))
 or (p_shift_hours is not null and p_price_unit is distinct from 'SHIFT')
 or p_tokens is null or coalesce(array_length(p_tokens,1),0) > 80
 or exists(select 1 from unnest(p_tokens) token where token is null or length(token) > 160)
 or (p_region is not null and length(p_region) > 160)
 or (p_offer_type is not null and p_offer_type not in ('RENT','SALE','SERVICE'))
 or (p_category is not null and p_category not in ('drill','excavator','compressor','transport','drillService','geoService'))
 or (p_method is not null and p_method not in ('CORE','RC','AUGER','ROTARY','DTH','SONIC','OTHER'))
 or (p_core_size is not null and p_core_size not in ('BQ','NQ','HQ','PQ','OTHER'))
 or (p_core_size is not null and p_method is not null and p_method <> 'CORE')
 or (p_site is not null and p_site not in ('SURFACE','UNDERGROUND'))
 or (p_trajectory is not null and p_trajectory not in ('VERTICAL','INCLINED','HORIZONTAL','DIRECTIONAL'))
 or (p_chassis is not null and p_chassis not in ('TRACKED','WHEELED','TRAILER','SKID'))
 or (p_machine_condition is not null and p_machine_condition not in ('NEW','USED','REFURBISHED'))
 or (p_min_year is not null and p_min_year not between 1900 and 2100)
 or (p_max_year is not null and p_max_year not between 1900 and 2100)
 or (p_min_year > p_max_year)
 or (p_purpose is not null and p_purpose not in ('MINERAL_EXPLORATION','WATER','GEOTECHNICAL','BLASTHOLE','GEOTHERMAL','HDD','OTHER'))
 or (p_currency is not null and p_currency not in ('KZT','USD','CNY'))
 or (p_price_unit is not null and p_price_unit not in ('HOUR','SHIFT','DAY','METER','OBJECT','ITEM'))
 or exists(select 1 from unnest(array[p_depth,p_diameter,p_bucket,p_mass,p_pressure,p_flow,p_payload,p_shift_hours]) n
           where n <= 0 or n > 20000)
 then raise exception 'invalid equipment search' using errcode = '22023'; end if;

 with visible as (
   select e.*, case when data->'schemaVersion' = '2'::jsonb then
     case when jsonb_typeof(data->'capabilities')='array' then data->'capabilities' else '[]'::jsonb end
     else jsonb_build_array(jsonb_build_object('method',data->'method','depth',data->'depth','diameter',data->'diameter'))
     end as modes
   from public.equipment_listings e where status = 'ACTIVE'
 ), matched as (
   select e.id, e.owner_id, e.status, e.revision, e.data, e.moderation_notes, e.updated_at
   from visible e
   where (p_offer_type is null or data->>'offerType' = p_offer_type)
   and (p_category is null or data->>'category' = p_category)
   and (p_region is null or public.equipment_search_normalize(data->>'region') = p_region)
   and (p_purpose is null or data->'purposes' ? p_purpose)
   and (p_site is null or data->>'site' = p_site)
   and (p_trajectory is null or data->>'trajectory' = p_trajectory)
   and (p_chassis is null or data->>'chassis' = p_chassis)
   and (p_machine_condition is null or data->>'machineCondition' = p_machine_condition)
   and (p_min_year is null or public.equipment_search_number(data,'machineYear') >= p_min_year)
   and (p_max_year is null or public.equipment_search_number(data,'machineYear') <= p_max_year)
   and ((p_method is null and p_depth is null and p_diameter is null and p_core_size is null) or exists (
     select 1 from jsonb_array_elements(modes) mode
     where (p_method is null or mode->>'method' = p_method)
     and (p_depth is null or public.equipment_search_number(mode,'depth') >= p_depth)
     and (p_core_size is null or (mode->>'method' = 'CORE' and mode->>'coreSize' = p_core_size))
     -- Working depth applies to this borehole size. Larger size is not proof of capacity at smaller size.
     and (p_diameter is null or public.equipment_search_number(mode,'diameter') = p_diameter)
   ))
   and (p_bucket is null or public.equipment_search_number(data,'bucket') >= p_bucket)
   and (p_mass is null or public.equipment_search_number(data,'mass') >= p_mass)
   and (p_pressure is null or public.equipment_search_number(data,'pressure') >= p_pressure)
   and (p_flow is null or public.equipment_search_number(data,'flow') >= p_flow)
   and (p_payload is null or public.equipment_search_number(data,'payload') >= p_payload)
   and (p_operator is null or data->'operator' = to_jsonb(p_operator))
   and (p_delivery is null or data->'delivery' = to_jsonb(p_delivery))
   and (p_currency is null or data->>'currency' = p_currency)
   and (p_price_unit is null or data->>'priceUnit' = p_price_unit)
   and (p_shift_hours is null or public.equipment_search_number(data,'shiftHours') = p_shift_hours)
   and not exists (
     select 1 from unnest(p_tokens) token
     where position(token in public.equipment_search_normalize(concat_ws(' ',
       data->>'title', data->>'description', data->>'region', data->>'city',
       data->>'brand', data->>'model', data->>'category',
       (select string_agg(mode->>'method',' ') from jsonb_array_elements(modes) mode)))) = 0
   )
 ), paged as (
   select *, row_number() over (order by
     case when p_sort = 'PRICE_ASC' then public.equipment_search_number(data,'price') end asc nulls last,
     updated_at desc, id asc) as ordinal
   from matched
   order by ordinal limit p_limit offset p_offset
 )
 select jsonb_build_object('total',(select count(*) from matched),
   'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'owner_id',owner_id,'status',status,'revision',revision,
      'data',data,'moderation_notes',moderation_notes,'updated_at',updated_at
   ) order by ordinal) from paged),'[]'::jsonb)) into result;
 return result;
end;
$$;

revoke all on function public.equipment_search_normalize(text) from public,anon,authenticated;
revoke all on function public.equipment_search_number(jsonb,text) from public,anon,authenticated;
grant execute on function public.equipment_search_normalize(text) to service_role;
grant execute on function public.equipment_search_number(jsonb,text) to service_role;
revoke all on function public.search_equipment_catalog(text,text,text,text,text,text,text,text,text,text,integer,integer,numeric,numeric,numeric,numeric,numeric,numeric,numeric,boolean,boolean,text,text,numeric,text,text[],integer,integer)
 from public,anon,authenticated;
grant execute on function public.search_equipment_catalog(text,text,text,text,text,text,text,text,text,text,integer,integer,numeric,numeric,numeric,numeric,numeric,numeric,numeric,boolean,boolean,text,text,numeric,text,text[],integer,integer)
 to service_role;
