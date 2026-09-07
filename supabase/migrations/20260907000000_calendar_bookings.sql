-- ============================================================================
-- Calendar / time-based bookings for Toosh Tattoos
--   * bookings gain `starts_at` (the chosen slot), `duration_min`, `ends_at`
--   * `ends_at` is kept in sync by a trigger (timestamptz + interval is only
--     STABLE, so it can't live in a generated column or an index expression)
--   * an exclusion constraint stops two live bookings overlapping in time
--   * public.booked_slots() lets the public booking page see which ranges are
--     taken WITHOUT exposing any booker PII (name / email / idea)
--
-- Requires 20260903010000_bookings.sql. Safe to re-run.
-- ============================================================================

create extension if not exists btree_gist;

alter table public.bookings add column if not exists starts_at    timestamptz;
alter table public.bookings add column if not exists duration_min int not null default 120;
alter table public.bookings add column if not exists ends_at      timestamptz;

-- Keep ends_at = starts_at + duration_min on every write.
create or replace function public.bookings_set_ends_at()
returns trigger
language plpgsql
as $$
begin
  new.ends_at := case
    when new.starts_at is null then null
    else new.starts_at + make_interval(mins => coalesce(new.duration_min, 120))
  end;
  return new;
end;
$$;

drop trigger if exists bookings_ends_at on public.bookings;
create trigger bookings_ends_at
  before insert or update of starts_at, duration_min on public.bookings
  for each row execute function public.bookings_set_ends_at();

update public.bookings
set ends_at = starts_at + make_interval(mins => duration_min)
where starts_at is not null and ends_at is null;

create index if not exists bookings_starts_at_idx
  on public.bookings (starts_at)
  where starts_at is not null;

-- No two non-declined scheduled bookings may overlap in time.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings add constraint bookings_no_overlap
      exclude using gist (tstzrange(starts_at, ends_at) with &&)
      where (starts_at is not null and ends_at is not null and status <> 'declined');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- booked_slots(from_ts, to_ts) — busy time ranges only, no personal data.
-- security definer so anon visitors can read availability past the RLS wall.
-- ----------------------------------------------------------------------------
create or replace function public.booked_slots(from_ts timestamptz, to_ts timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.starts_at is not null
    and b.status <> 'declined'
    and b.starts_at < to_ts
    and b.ends_at > from_ts
$$;

revoke all on function public.booked_slots(timestamptz, timestamptz) from public;
grant execute on function public.booked_slots(timestamptz, timestamptz) to anon, authenticated;
