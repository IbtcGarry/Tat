-- ============================================================================
-- Toosh Tattoos — full schema bootstrap
-- Paste this whole file into the Supabase dashboard SQL editor and run once.
-- It is the 6 migrations concatenated in order. Safe to re-run.
--   https://supabase.com/dashboard/project/bctpojoyqbehzexdotgk/sql/new
-- After running, sign up on the site, then scroll to the bottom of this file
-- and run the PROMOTE step with your email.
-- ============================================================================


-- ====================  20260903000000_admin_content.sql  ====================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);
alter table public.profiles add column if not exists username   text;
alter table public.profiles add column if not exists role       text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles enable row level security;

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

insert into public.profiles (id, username)
select u.id, u.raw_user_meta_data ->> 'username'
from auth.users u
on conflict (id) do nothing;

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


-- ====================  20260903010000_bookings.sql  ====================

create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  placement  text,
  idea       text,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "anyone can create bookings" on public.bookings;
create policy "anyone can create bookings"
  on public.bookings for insert
  with check (true);

drop policy if exists "admins read bookings" on public.bookings;
create policy "admins read bookings"
  on public.bookings for select
  using (public.is_admin());

drop policy if exists "admins update bookings" on public.bookings;
create policy "admins update bookings"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete bookings" on public.bookings;
create policy "admins delete bookings"
  on public.bookings for delete
  using (public.is_admin());


-- ====================  20260904000000_item_frames.sql  ====================

alter table public.recent_work   add column if not exists frame text not null default 'plain';
alter table public.gallery_items add column if not exists frame text not null default 'plain';
alter table public.shop_items    add column if not exists frame text not null default 'plain';

alter table public.recent_work   drop constraint if exists recent_work_frame_check;
alter table public.recent_work   add constraint recent_work_frame_check
  check (frame in ('plain', 'gothic', 'ornate'));

alter table public.gallery_items drop constraint if exists gallery_items_frame_check;
alter table public.gallery_items add constraint gallery_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate'));

alter table public.shop_items    drop constraint if exists shop_items_frame_check;
alter table public.shop_items    add constraint shop_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate'));


-- ====================  20260904010000_account_bookings.sql  ====================

drop policy if exists "users read own bookings" on public.bookings;
create policy "users read own bookings"
  on public.bookings for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));


-- ====================  20260905000000_frame_transparent.sql  ====================

alter table public.recent_work   drop constraint if exists recent_work_frame_check;
alter table public.recent_work   add constraint recent_work_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));

alter table public.gallery_items drop constraint if exists gallery_items_frame_check;
alter table public.gallery_items add constraint gallery_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));

alter table public.shop_items    drop constraint if exists shop_items_frame_check;
alter table public.shop_items    add constraint shop_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));


-- ====================  20260906000000_image_transform.sql  ====================

alter table public.recent_work   add column if not exists scale   real not null default 1;
alter table public.recent_work   add column if not exists focus_x  real not null default 50;
alter table public.recent_work   add column if not exists focus_y  real not null default 50;

alter table public.gallery_items add column if not exists scale   real not null default 1;
alter table public.gallery_items add column if not exists focus_x  real not null default 50;
alter table public.gallery_items add column if not exists focus_y  real not null default 50;

alter table public.shop_items    add column if not exists scale   real not null default 1;
alter table public.shop_items    add column if not exists focus_x  real not null default 50;
alter table public.shop_items    add column if not exists focus_y  real not null default 50;


-- ============================================================================
-- PROMOTE YOURSELF TO ADMIN  (run after signing up on the site)
--
--   update public.profiles set role = 'master'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================================
