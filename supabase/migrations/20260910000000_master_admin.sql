-- ============================================================================
-- Master admin.
--   * role 'master' = everything an admin can do (is_admin() already counts it)
--     PLUS, on the website, granting/revoking 'admin' on other accounts by email
--   * 'master' itself can ONLY be set from SQL (this file / the SQL editor) —
--     there is no API path to create one
--
-- Requires 20260903000000_admin_content.sql. Safe to re-run.
-- ============================================================================

-- who is a master
create or replace function public.is_master()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'master'
  );
$$;

-- Tighten profile writes: only masters may update profiles now. Regular admins
-- never had a UI for this; masters go through set_user_role() below.
drop policy if exists "admins update profiles" on public.profiles;
drop policy if exists "masters update profiles" on public.profiles;
create policy "masters update profiles"
  on public.profiles for update
  using (public.is_master())
  with check (public.is_master());

-- 'master' may only be assigned or removed from SQL (no request context).
create or replace function public.profiles_protect_master()
returns trigger
language plpgsql
as $$
declare
  via_api boolean := coalesce(current_setting('request.jwt.claims', true), '') <> '';
begin
  if via_api and (
       new.role = 'master'
       or (tg_op = 'UPDATE' and old.role = 'master' and new.role is distinct from 'master')
     ) then
    raise exception 'master admin can only be changed in SQL';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_master on public.profiles;
create trigger profiles_protect_master
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_master();

-- ----------------------------------------------------------------------------
-- list_user_roles() — masters see every account with its email + role
-- ----------------------------------------------------------------------------
create or replace function public.list_user_roles()
returns table (email text, username text, role text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select u.email::text, p.username, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_master()
  order by
    case p.role when 'master' then 0 when 'admin' then 1 else 2 end,
    u.email;
$$;

revoke all on function public.list_user_roles() from public;
grant execute on function public.list_user_roles() to authenticated;

-- ----------------------------------------------------------------------------
-- set_user_role(email, role) — a master grants/revokes 'admin' by email
-- ----------------------------------------------------------------------------
create or replace function public.set_user_role(target_email text, new_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  cur text;
begin
  if not public.is_master() then
    raise exception 'only master admins can change roles';
  end if;
  if new_role not in ('user', 'admin') then
    raise exception 'role must be user or admin';
  end if;

  select u.id, p.role into uid, cur
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(target_email);

  if uid is null then
    raise exception 'no account with that email';
  end if;
  if cur = 'master' then
    raise exception 'that account is a master admin';
  end if;

  insert into public.profiles (id, role)
  values (uid, new_role)
  on conflict (id) do update set role = excluded.role;

  return target_email || ' -> ' || new_role;
end;
$$;

revoke all on function public.set_user_role(text, text) from public;
grant execute on function public.set_user_role(text, text) to authenticated;

-- ============================================================================
-- MASTER ADMIN SQL BOARD
-- Run this in the Supabase SQL editor to make / unmake a master admin.
-- (This is the only place 'master' can be set — the website cannot.)
--
--   -- promote
--   update public.profiles set role = 'master'
--   where id = (select id from auth.users where lower(email) = lower('you@example.com'));
--
--   -- demote back to a normal admin
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where lower(email) = lower('you@example.com'));
--
--   -- see everyone
--   select u.email, p.role
--   from public.profiles p join auth.users u on u.id = p.id
--   order by p.role, u.email;
-- ============================================================================
