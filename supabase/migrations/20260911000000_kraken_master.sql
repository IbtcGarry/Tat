-- ============================================================================
-- Kraken4500@gmail.com is provisioned as a MASTER admin on signup (was admin).
-- The master-protect trigger now honours a per-transaction bypass flag so the
-- SECURITY DEFINER signup path can seed a master, while every API write of
-- role='master' stays blocked.
--
-- Requires 20260910000000_master_admin.sql. Safe to re-run.
-- ============================================================================

create or replace function public.profiles_protect_master()
returns trigger
language plpgsql
as $$
declare
  via_api boolean := coalesce(current_setting('request.jwt.claims', true), '') <> '';
  bypass  boolean := coalesce(current_setting('app.master_guard_bypass', true), '') = 'on';
begin
  if bypass then
    return new;
  end if;
  if via_api and (
       new.role = 'master'
       or (tg_op = 'UPDATE' and old.role = 'master' and new.role is distinct from 'master')
     ) then
    raise exception 'master admin can only be changed in SQL';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner boolean := lower(coalesce(new.email, '')) = lower('Kraken4500@gmail.com');
begin
  if is_owner then
    perform set_config('app.master_guard_bypass', 'on', true);  -- this txn only
  end if;

  insert into public.profiles (id, username, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    case when is_owner then 'master' else 'user' end
  )
  on conflict (id) do update
    set role = case when is_owner then 'master' else public.profiles.role end;
  return new;
end;
$$;

-- Upgrade the account if it already exists (runs from SQL, so the guard allows it).
update public.profiles p
set role = 'master'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('Kraken4500@gmail.com')
  and p.role is distinct from 'master';
