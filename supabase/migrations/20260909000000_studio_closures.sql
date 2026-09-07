-- ============================================================================
-- Studio closures — admin blacks out individual calendar days (holidays, days
-- off). Closed days disappear from the public booking calendar.
--
--   * anyone can read the list (the booking page needs it)
--   * only admins can add / remove a closed day
--
-- Requires 20260903000000_admin_content.sql (public.is_admin()). Safe to re-run.
-- ============================================================================

create table if not exists public.studio_closures (
  day        date primary key,
  reason     text,
  created_at timestamptz not null default now()
);

alter table public.studio_closures enable row level security;

drop policy if exists "closures are public" on public.studio_closures;
create policy "closures are public"
  on public.studio_closures for select
  using (true);

drop policy if exists "admins manage closures" on public.studio_closures;
create policy "admins manage closures"
  on public.studio_closures for all
  using (public.is_admin())
  with check (public.is_admin());
