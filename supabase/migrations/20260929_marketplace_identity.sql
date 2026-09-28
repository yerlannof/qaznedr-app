-- Private Google identity mapping. This intentionally does not use auth.users or
-- the legacy users table, and never stores a password or provider token.
create table if not exists public.marketplace_accounts (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  provider text not null default 'google' check (provider = 'google'),
  provider_subject text not null check (
    length(provider_subject) between 1 and 255 and
    provider_subject = btrim(provider_subject)
  ),
  email text not null unique check (
    length(email) between 3 and 254 and
    email = lower(btrim(email)) and
    email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  name text check (length(name) between 1 and 200),
  image text check (length(image) <= 2048 and image ~ '^https://'),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  unique (provider, provider_subject)
);

alter table public.marketplace_accounts enable row level security;
revoke all on table public.marketplace_accounts from public, anon, authenticated;
grant select, insert, update on table public.marketplace_accounts to service_role;

-- Legacy profiles had a public SELECT policy. JWT identities are checked by
-- application server code; no browser role needs direct access to this table.
alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;
do $migration$
declare policy_name text;
begin
  for policy_name in
    select pol.policyname from pg_catalog.pg_policies pol
    where pol.schemaname = 'public' and pol.tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', policy_name);
  end loop;
end
$migration$;
grant select, insert, update on table public.profiles to service_role;

create or replace function public.provision_google_marketplace_identity(
  p_subject text,
  p_email text,
  p_name text,
  p_image text
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $function$
declare
  existing_account public.marketplace_accounts%rowtype;
  new_id uuid;
begin
  if p_subject is null or length(p_subject) not between 1 and 255
     or p_subject <> btrim(p_subject)
     or p_email is null or length(p_email) not between 3 and 254
     or p_email <> lower(btrim(p_email))
     or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or (p_name is not null and (length(p_name) not between 1 and 200 or p_name <> btrim(p_name)))
     or (p_image is not null and (length(p_image) > 2048 or p_image !~ '^https://'))
  then
    raise exception 'Marketplace identity conflict' using errcode = '23505';
  end if;

  -- Serialize same-email claims, including existing profile collision checks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email, 0));

  select * into existing_account
  from public.marketplace_accounts
  where provider = 'google' and provider_subject = p_subject
  for update;

  if found then
    if existing_account.email <> p_email or not exists (
      select 1 from public.profiles
      where id = existing_account.id::text and lower(btrim(email)) = p_email
    ) then
      raise exception 'Marketplace identity conflict' using errcode = '23505';
    end if;

    update public.marketplace_accounts
    set last_login_at = now()
    where id = existing_account.id;
    return pg_catalog.jsonb_build_object(
      'id', existing_account.id,
      'email', existing_account.email,
      'name', existing_account.name,
      'image', existing_account.image
    );
  end if;

  if exists (select 1 from public.marketplace_accounts where email = p_email)
     or exists (select 1 from public.profiles where lower(btrim(email)) = p_email)
  then
    raise exception 'Marketplace identity conflict' using errcode = '23505';
  end if;

  insert into public.marketplace_accounts (provider, provider_subject, email, name, image)
  values ('google', p_subject, p_email, p_name, p_image)
  returning id into new_id;

  -- An error here aborts the function's statement and rolls back the account.
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (new_id::text, coalesce(p_name, split_part(p_email, '@', 1)), p_email, p_image, 'user');

  return pg_catalog.jsonb_build_object(
    'id', new_id,
    'email', p_email,
    'name', p_name,
    'image', p_image
  );
end
$function$;

revoke all on function public.provision_google_marketplace_identity(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.provision_google_marketplace_identity(text, text, text, text)
  to service_role;
