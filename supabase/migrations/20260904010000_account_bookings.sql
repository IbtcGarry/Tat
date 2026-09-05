-- ============================================================================
-- Let a signed-in user read their own booking requests (by matching email),
-- for the new /account page. Admins already see everything via is_admin().
-- Multiple permissive `for select` policies on the same table are OR'd
-- together by Postgres, so this adds to — not replaces — the admin policy.
-- Safe to re-run.
-- ============================================================================

drop policy if exists "users read own bookings" on public.bookings;
create policy "users read own bookings"
  on public.bookings for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
