-- ============================================================================
-- Auto-grant admin to a specific email on signup.
-- Anyone who signs up as Kraken4500@gmail.com (any casing) lands with
-- role = 'admin'; everyone else is unaffected.
--
-- Requires 20260903000000_admin_content.sql. Safe to re-run.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner boolean := lower(coalesce(new.email, '')) = lower('Kraken4500@gmail.com');
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    case when is_owner then 'admin' else 'user' end
  )
  on conflict (id) do update
    set role = case when is_owner then 'admin' else public.profiles.role end;
  return new;
end;
$$;

-- Trigger definition is unchanged, but re-assert it in case this file is run
-- against a database that never had 20260903000000 applied.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Promote the owner if they already signed up before this migration.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('Kraken4500@gmail.com')
  and p.role <> 'admin';
