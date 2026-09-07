-- ============================================================================
-- Booking system for Toosh Tattoos
--   * anyone (even signed-out visitors) can submit a booking request
--   * only admins can read / update status / delete
--
-- Requires 20260903000000_admin_content.sql to have been run first
-- (it defines public.is_admin()). Safe to re-run.
-- ============================================================================

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

-- Anyone can create a booking request (the public contact form).
drop policy if exists "anyone can create bookings" on public.bookings;
create policy "anyone can create bookings"
  on public.bookings for insert
  with check (true);

-- Only admins can see them.
drop policy if exists "admins read bookings" on public.bookings;
create policy "admins read bookings"
  on public.bookings for select
  using (public.is_admin());

-- Only admins can change status.
drop policy if exists "admins update bookings" on public.bookings;
create policy "admins update bookings"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete.
drop policy if exists "admins delete bookings" on public.bookings;
create policy "admins delete bookings"
  on public.bookings for delete
  using (public.is_admin());
