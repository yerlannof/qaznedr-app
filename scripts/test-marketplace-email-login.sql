-- Run only on an isolated local Postgres database:
-- psql -v ON_ERROR_STOP=1 -d marketplace_email_test -f scripts/test-marketplace-email-login.sql
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
  role text not null default 'user'
);

\ir ../supabase/migrations/20260929_marketplace_identity.sql
\ir ../supabase/migrations/20261016_marketplace_email_login.sql

set local role anon;
do $$ begin
  begin
    perform 1 from public.marketplace_email_tokens;
    raise exception 'anon token SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.issue_marketplace_email_token('a@example.com', repeat('a', 64), repeat('b', 64));
    raise exception 'anon issue RPC succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('a', 64));
    raise exception 'anon sign-in RPC succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
do $$ begin
  begin
    perform 1 from public.marketplace_email_tokens;
    raise exception 'authenticated token SELECT succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role service_role;
do $$
declare
  first_identity jsonb;
  second_identity jsonb;
  result text;
  i int;
begin
  -- Issue, consume once, reject reuse.
  if public.issue_marketplace_email_token('driller@example.com', repeat('1', 64), repeat('f', 64)) <> 'issued' then
    raise exception 'first token not issued';
  end if;
  first_identity := public.sign_in_with_marketplace_email_token(repeat('1', 64));
  if first_identity->>'email' <> 'driller@example.com' then
    raise exception 'wrong identity email %', first_identity;
  end if;
  if not exists (
    select 1 from public.marketplace_accounts
    where id = (first_identity->>'id')::uuid and provider = 'email'
      and provider_subject = 'driller@example.com'
  ) then
    raise exception 'email account not created';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = first_identity->>'id' and role = 'user' and full_name = 'driller'
  ) then
    raise exception 'profile not created';
  end if;
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('1', 64));
    raise exception 'token reuse succeeded';
  exception when invalid_parameter_value then null;
  end;

  -- A second token for the same address signs in to the same account.
  perform public.issue_marketplace_email_token('driller@example.com', repeat('2', 64), repeat('f', 64));
  second_identity := public.sign_in_with_marketplace_email_token(repeat('2', 64));
  if second_identity->>'id' <> first_identity->>'id' then
    raise exception 'second sign-in created another account';
  end if;

  -- Expired tokens are rejected.
  perform public.issue_marketplace_email_token('late@example.com', repeat('3', 64), repeat('e', 64));
  update public.marketplace_email_tokens
  set expires_at = now() - interval '1 second'
  where token_hash = repeat('3', 64);
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('3', 64));
    raise exception 'expired token succeeded';
  exception when invalid_parameter_value then null;
  end;

  -- Unknown tokens are rejected.
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('9', 64));
    raise exception 'unknown token succeeded';
  exception when invalid_parameter_value then null;
  end;

  -- No automatic linking with a Google account on the same address.
  perform public.provision_google_marketplace_identity('google-sub', 'google@example.com', 'G', null);
  perform public.issue_marketplace_email_token('google@example.com', repeat('4', 64), repeat('d', 64));
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('4', 64));
    raise exception 'email sign-in linked a Google account';
  exception when unique_violation then null;
  end;
  -- The conflict rolled back token consumption, so it stays unused.
  if (select used_at from public.marketplace_email_tokens where token_hash = repeat('4', 64)) is not null then
    raise exception 'conflicting token was consumed';
  end if;
  -- Google sign-in for an e-mail account address is refused as well.
  begin
    perform public.provision_google_marketplace_identity('other-sub', 'driller@example.com', null, null);
    raise exception 'Google sign-in linked an email account';
  exception when unique_violation then null;
  end;

  -- Legacy profiles are never adopted.
  insert into public.profiles (id, full_name, email) values ('legacy', 'Legacy', 'legacy@example.com');
  perform public.issue_marketplace_email_token('legacy@example.com', repeat('5', 64), repeat('c', 64));
  begin
    perform public.sign_in_with_marketplace_email_token(repeat('5', 64));
    raise exception 'legacy profile adopted';
  exception when unique_violation then null;
  end;

  -- Per-address limit: 3 per 15 minutes.
  for i in 1..3 loop
    result := public.issue_marketplace_email_token('flood@example.com', lpad(to_hex(1000 + i), 64, '0'), repeat('a', 64));
    if result <> 'issued' then raise exception 'flood token % not issued', i; end if;
  end loop;
  if public.issue_marketplace_email_token('flood@example.com', lpad(to_hex(2000), 64, '0'), repeat('a', 64)) <> 'rate_limited' then
    raise exception 'per-address limit not applied';
  end if;

  -- Per-IP limit: 10 per hour across addresses (ip 'a' already has 3).
  for i in 1..7 loop
    result := public.issue_marketplace_email_token('ip' || i || '@example.com', lpad(to_hex(3000 + i), 64, '0'), repeat('a', 64));
    if result <> 'issued' then raise exception 'ip token % not issued', i; end if;
  end loop;
  if public.issue_marketplace_email_token('fresh@example.com', lpad(to_hex(4000), 64, '0'), repeat('a', 64)) <> 'rate_limited' then
    raise exception 'per-IP limit not applied';
  end if;

  -- Old rows are purged on the next issue.
  update public.marketplace_email_tokens set created_at = now() - interval '3 days'
  where email = 'flood@example.com';
  perform public.issue_marketplace_email_token('purge@example.com', lpad(to_hex(5000), 64, '0'), repeat('7', 64));
  if exists (select 1 from public.marketplace_email_tokens where email = 'flood@example.com') then
    raise exception 'old tokens not purged';
  end if;

  -- Hash shape is enforced.
  begin
    perform public.issue_marketplace_email_token('shape@example.com', 'raw-token', repeat('7', 64));
    raise exception 'raw token stored';
  exception when check_violation then null;
  end;
end $$;
reset role;

rollback;
\echo 'marketplace email login: all checks passed'
