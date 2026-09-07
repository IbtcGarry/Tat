-- ============================================================================
-- Admin-confirmed bookings.
--   * A public booking request (status 'new') is now just a request — it does
--     NOT reserve the slot, so several people may ask for the same time.
--   * Only when an admin confirms it (status 'booked', with an admin-chosen
--     start time + duration) does the slot get locked against everyone else.
--   * The no-overlap guarantee therefore applies to confirmed bookings only.
--
-- Requires 20260907000000_calendar_bookings.sql. Safe to re-run.
-- ============================================================================

-- Only confirmed bookings may not overlap (was: any non-declined booking).
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
  where (starts_at is not null and ends_at is not null and status = 'booked');

-- Public availability = confirmed bookings only.
create or replace function public.booked_slots(from_ts timestamptz, to_ts timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.starts_at is not null
    and b.status = 'booked'
    and b.starts_at < to_ts
    and b.ends_at > from_ts
$$;

revoke all on function public.booked_slots(timestamptz, timestamptz) from public;
grant execute on function public.booked_slots(timestamptz, timestamptz) to anon, authenticated;
