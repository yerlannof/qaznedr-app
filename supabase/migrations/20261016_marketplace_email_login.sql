-- Passwordless e-mail sign-in for marketplace authors who do not use Google.
-- Only SHA-256 hashes of one-time tokens are stored; the raw token lives in the
-- e-mail link fragment and never reaches server logs.

alter table public.marketplace_accounts
  drop constraint if exists marketplace_accounts_provider_check;
alter table public.marketplace_accounts
  add constraint marketplace_accounts_provider_check
  check (provider in ('google', 'email'));

create table if not exists public.marketplace_email_tokens (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  email text not null check (
    length(email) between 3 and 254 and
    email = lower(btrim(email)) and
    email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz
);

create index if not exists marketplace_email_tokens_email_idx
  on public.marketplace_email_tokens (email, created_at desc);
create index if not exists marketplace_email_tokens_ip_idx
  on public.marketplace_email_tokens (ip_hash, created_at desc);

alter table public.marketplace_email_tokens enable row level security;
revoke all on table public.marketplace_email_tokens from public, anon, authenticated;
grant select, insert, update, delete on table public.marketplace_email_tokens to service_role;

-- Returns 'issued' or 'rate_limited'. Limits live in the database because the
-- in-memory/Upstash limiter is not configured in production.
create or replace function public.issue_marketplace_email_token(
  p_email text,
  p_token_hash text,
  p_ip_hash text
) returns text
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $function$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('email-link:' || p_email, 0));

  delete from public.marketplace_email_tokens
  where created_at < now() - interval '2 days';

  if (select count(*) from public.marketplace_email_tokens
      where email = p_email and created_at > now() - interval '15 minutes') >= 3
     or (select count(*) from public.marketplace_email_tokens
      where email = p_email and created_at > now() - interval '1 day') >= 10
     or (select count(*) from public.marketplace_email_tokens
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10
  then
    return 'rate_limited';
  end if;

  insert into public.marketplace_email_tokens (token_hash, email, ip_hash)
  values (p_token_hash, p_email, p_ip_hash);
  return 'issued';
end
$function$;

-- Consumes a token and returns the e-mail account. A Google account or legacy
-- profile with the same address is never linked automatically.
create or replace function public.sign_in_with_marketplace_email_token(
  p_token_hash text
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $function$
declare
  token_email text;
  existing_account public.marketplace_accounts%rowtype;
  new_id uuid;
begin
  update public.marketplace_email_tokens
  set used_at = now()
  where token_hash = p_token_hash and used_at is null and expires_at > now()
  returning email into token_email;

  if token_email is null then
    raise exception 'Marketplace email token invalid' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(token_email, 0));

  select * into existing_account
  from public.marketplace_accounts
  where email = token_email
  for update;

  if found then
    if existing_account.provider <> 'email' then
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

  if exists (select 1 from public.profiles where lower(btrim(email)) = token_email) then
    raise exception 'Marketplace identity conflict' using errcode = '23505';
  end if;

  insert into public.marketplace_accounts (provider, provider_subject, email)
  values ('email', token_email, token_email)
  returning id into new_id;

  insert into public.profiles (id, full_name, email, role)
  values (new_id::text, split_part(token_email, '@', 1), token_email, 'user');

  return pg_catalog.jsonb_build_object(
    'id', new_id,
    'email', token_email,
    'name', null,
    'image', null
  );
end
$function$;

revoke all on function public.issue_marketplace_email_token(text, text, text)
  from public, anon, authenticated;
revoke all on function public.sign_in_with_marketplace_email_token(text)
  from public, anon, authenticated;
grant execute on function public.issue_marketplace_email_token(text, text, text)
  to service_role;
grant execute on function public.sign_in_with_marketplace_email_token(text)
  to service_role;
