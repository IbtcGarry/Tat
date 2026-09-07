-- ============================================================================
-- Admin / worker content system for Toosh Tattoos
--   * profiles table with a `role` column ('user' | 'admin')
--   * recent_work / gallery_items / shop_items content tables
--   * a public `media` storage bucket
--   * RLS: everyone can read content, only admins can write
--
-- Run this whole file in the Supabase SQL editor. It is safe to re-run.
-- Then promote yourself — see the bottom of this file.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles (table may already exist from an earlier run — ensure columns)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);
alter table public.profiles add column if not exists username   text;
alter table public.profiles add column if not exists role       text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- is_admin() — security definer so it can read profiles without tripping RLS.
-- Defined AFTER profiles.role exists, BEFORE any policy that references it.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'master')
  );
$$;

-- ----------------------------------------------------------------------------
-- profiles policies
-- ----------------------------------------------------------------------------
drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
  on public.profiles for select
  using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- auto-create a profile row on signup, copying the username from metadata
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profile rows for anyone who signed up before this migration.
insert into public.profiles (id, username)
select u.id, u.raw_user_meta_data ->> 'username'
from auth.users u
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- content tables
-- ----------------------------------------------------------------------------
create table if not exists public.recent_work (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  meta       text,
  image_url  text not null,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  meta       text,
  image_url  text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       text,
  tag         text,
  description text,
  image_url   text not null,
  created_at  timestamptz not null default now()
);

-- RLS: public read, admin write — applied identically to all three tables.
do $$
declare
  t text;
begin
  foreach t in array array['recent_work', 'gallery_items', 'shop_items']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s public read" on public.%I', t, t);
    execute format(
      'create policy "%s public read" on public.%I for select using (true)', t, t);

    execute format('drop policy if exists "%s admin write" on public.%I', t, t);
    execute format(
      'create policy "%s admin write" on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- storage: a public `media` bucket, admin-only writes
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media admin write" on storage.objects;
create policy "media admin write"
  on storage.objects for all
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- ============================================================================
-- PROMOTE YOURSELF TO ADMIN
-- Sign up on the site first, then run (with your email):
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================================
