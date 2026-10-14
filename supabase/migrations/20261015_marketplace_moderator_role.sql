-- Marketplace moderator role: reviews equipment listings, has no other admin powers.
-- Assign by hand after the person's first Google sign-in, e.g.
--   update public.profiles set role = 'moderator' where email = '<google email>';

do $$
declare
  constraint_name text;
begin
  -- 20260505_add_admin_roles.sql added the role check inline, so its name is generated.
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.profiles'::regclass
      and con.contype = 'c'
      and att.attname = 'role'
  loop
    execute format(
      'alter table public.profiles drop constraint %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'moderator', 'admin', 'super_admin'));

drop index if exists public.idx_profiles_role;
create index if not exists idx_profiles_role on public.profiles (role)
  where role in ('moderator', 'admin', 'super_admin');
