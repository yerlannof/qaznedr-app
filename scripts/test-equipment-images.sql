-- Isolated database only. Requires equipment foundation and Supabase storage schema.
-- The fixture can provide storage.buckets/objects without a running Storage API.
begin;

-- A deliberately broad existing policy must not reopen the private bucket.
create policy equipment_images_test_permissive on storage.objects for all to anon, authenticated
  using (true) with check (true);
insert into storage.buckets(id,name,public) values('fixture-public','fixture-public',false)
  on conflict(id) do nothing;
insert into storage.objects (bucket_id, name) values
  ('equipment-images', 'not-public.webp'), ('fixture-public', 'control.webp');

set local role anon;
do $$ begin
  begin
    perform 1 from public.equipment_listing_images;
    raise exception 'anon image SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner-fixture', 1,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bad', 10, 10, 20);
    raise exception 'anon image RPC unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from storage.objects where bucket_id = 'equipment-images') then
    raise exception 'anon read private bucket through broad policy';
  end if;
  if not exists(select 1 from storage.objects where bucket_id = 'fixture-public') then
    raise exception 'private bucket restriction affected another bucket';
  end if;
  begin
    insert into storage.objects(bucket_id, name) values ('equipment-images', 'injected.webp');
    raise exception 'anon private upload unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform 1 from public.equipment_listing_images;
    raise exception 'authenticated image SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner-fixture', 1,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bad', 10, 10, 20);
    raise exception 'authenticated image RPC unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from storage.objects where bucket_id = 'equipment-images') then
    raise exception 'authenticated read private bucket through broad policy';
  end if;
  begin
    delete from storage.objects where bucket_id = 'equipment-images';
    if found then raise exception 'authenticated deleted private object'; end if;
  exception when insufficient_privilege then null; end;
  begin
    update storage.objects set bucket_id='equipment-images' where bucket_id='fixture-public';
    raise exception 'authenticated moved an object into the private bucket';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
insert into public.equipment_listings (id, owner_id)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into storage.objects(bucket_id, name)
values ('equipment-images', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp');

do $$ declare result jsonb; begin
  result := public.attach_equipment_image(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp', 10, 10, 20);
  if result->>'revision' <> '2' or result->>'status' <> 'DRAFT' or result->'image'->>'position' <> '0' then
    raise exception 'unexpected attached image shape';
  end if;
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'wrong-owner', 2,
      gen_random_uuid(), 'bad', 10, 10, 20);
    raise exception 'different owner attached image';
  exception when no_data_found then null; end;
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1,
      gen_random_uuid(), 'bad', 10, 10, 20);
    raise exception 'stale attach succeeded';
  exception when sqlstate '40001' then null; end;
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 2,
      gen_random_uuid(), '../other.webp', 10, 10, 20);
    raise exception 'path injection succeeded';
  exception when invalid_parameter_value then null; end;
  if (select revision from public.equipment_listings where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 2
    or (select count(*) from public.equipment_listing_images) <> 1
    or (select count(*) from public.equipment_moderation_events where listing_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 1 then
    raise exception 'failed attach changed image, revision or event';
  end if;
end $$;

select public.transition_equipment_listing(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'DRAFT', 2,
  'PENDING_MODERATION', 3, '{}'::jsonb, null, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
select public.transition_equipment_listing(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PENDING_MODERATION', 3,
  'ACTIVE', 4, '{}'::jsonb, null, 'moderator-fixture');
do $$ declare image_id uuid; result jsonb; current_revision integer := 4; begin
  for i in 1..7 loop
    image_id := gen_random_uuid();
    insert into storage.objects(bucket_id,name) values ('equipment-images',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || image_id || '.webp');
    result := public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_revision,
      image_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || image_id || '.webp', 10, 10, 20);
    current_revision := current_revision + 1;
    if result->>'status' <> 'PENDING_MODERATION' or (result->'image'->>'position')::integer <> i then
      raise exception 'image edit did not hide ACTIVE or preserve order';
    end if;
  end loop;
  begin
    perform public.transition_equipment_listing(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PENDING_MODERATION', 4,
      'ACTIVE', 5, '{}'::jsonb, null, 'moderator-fixture');
    raise exception 'old moderation accepted after image changes';
  exception when sqlstate '40001' then null; end;
  image_id := gen_random_uuid();
  insert into storage.objects(bucket_id,name) values ('equipment-images',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || image_id || '.webp');
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_revision,
      image_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || image_id || '.webp', 10, 10, 20);
    raise exception 'ninth image accepted';
  exception when sqlstate '54000' then null; end;
  if (select count(*) from public.equipment_listing_images) <> 8
    or (select revision from public.equipment_listings where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> current_revision then
    raise exception 'quota failure left partial image or changed revision';
  end if;
  perform public.transition_equipment_listing(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PENDING_MODERATION', current_revision,
    'ARCHIVED', current_revision+1, '{}'::jsonb, null, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  begin
    perform public.attach_equipment_image(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_revision+1,
      image_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || image_id || '.webp', 10, 10, 20);
    raise exception 'archived item accepted image';
  exception when sqlstate '40001' then null; end;
end $$;

rollback;
