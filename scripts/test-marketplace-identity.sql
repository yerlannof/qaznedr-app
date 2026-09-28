-- Run only on an isolated local Postgres database:
-- psql -v ON_ERROR_STOP=1 -d marketplace_identity_test -f scripts/test-marketplace-identity.sql
-- The transaction rolls back the entire bootstrap and test fixture.
begin;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
create table public.profiles (
  id text primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin'))
);
grant select, insert, update on public.profiles to anon, authenticated;
alter table public.profiles enable row level security;
create policy old_public_profile_read on public.profiles for select using (true);

\ir ../supabase/migrations/20260929_marketplace_identity.sql

set local role anon;
do $$ begin
  begin
    perform 1 from public.marketplace_accounts;
    raise exception 'anon account SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.profiles;
    raise exception 'anon profile SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.provision_google_marketplace_identity('anon-sub', 'anon@example.com', null, null);
    raise exception 'anon RPC succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
do $$ begin
  begin
    perform 1 from public.marketplace_accounts;
    raise exception 'authenticated account SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.profiles;
    raise exception 'authenticated profile SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.provision_google_marketplace_identity('auth-sub', 'auth@example.com', null, null);
    raise exception 'authenticated RPC succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role service_role;
do $$
declare first jsonb; repeated jsonb;
begin
  first := public.provision_google_marketplace_identity(
    'subject-one', 'first@example.com', 'Original Name', 'https://example.com/one.png');
  if first->>'email' <> 'first@example.com' or first->>'name' <> 'Original Name' then
    raise exception 'unexpected identity JSON';
  end if;
  if (select role from public.profiles where id = first->>'id') <> 'user' then
    raise exception 'initial role was not user';
  end if;

  update public.profiles set role = 'admin', full_name = 'Edited Name' where id = first->>'id';
  repeated := public.provision_google_marketplace_identity(
    'subject-one', 'first@example.com', 'Changed Google Name', null);
  if repeated->>'id' <> first->>'id' then
    raise exception 'repeat changed account ID';
  end if;
  if (select role from public.profiles where id = first->>'id') <> 'admin'
     or (select full_name from public.profiles where id = first->>'id') <> 'Edited Name' then
    raise exception 'repeat overwrote profile edits or role';
  end if;

  begin
    perform public.provision_google_marketplace_identity(
      'subject-two', 'first@example.com', null, null);
    raise exception 'different subject claimed existing email';
  exception when unique_violation then null;
  end;
  begin
    perform public.provision_google_marketplace_identity(
      'subject-one', 'changed@example.com', null, null);
    raise exception 'same subject changed email';
  exception when unique_violation then null;
  end;
  if (select count(*) from public.marketplace_accounts) <> 1
     or (select count(*) from public.profiles) <> 1 then
    raise exception 'conflict left partial identity';
  end if;

  insert into public.profiles (id, full_name, email)
  values ('existing-profile', 'Existing', 'taken@example.com');
  begin
    perform public.provision_google_marketplace_identity(
      'subject-three', 'taken@example.com', null, null);
    raise exception 'existing profile email claimed';
  exception when unique_violation then null;
  end;
  if exists (select 1 from public.marketplace_accounts where provider_subject = 'subject-three') then
    raise exception 'profile email conflict left an account';
  end if;
end $$;

reset role;
create function public.reject_smoke_profile() returns trigger language plpgsql as $$
begin
  if new.email = 'fail@example.com' then
    raise exception 'smoke profile failure';
  end if;
  return new;
end $$;
create trigger reject_smoke_profile before insert on public.profiles
for each row execute function public.reject_smoke_profile();

set local role service_role;
do $$ begin
  begin
    perform public.provision_google_marketplace_identity(
      'subject-fail', 'fail@example.com', null, null);
    raise exception 'profile failure unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'smoke profile failure' then raise; end if;
  end;
  if exists (select 1 from public.marketplace_accounts where provider_subject = 'subject-fail')
     or exists (select 1 from public.profiles where email = 'fail@example.com') then
    raise exception 'profile failure left partial identity';
  end if;
end $$;

rollback;
