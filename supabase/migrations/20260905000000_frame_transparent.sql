-- ============================================================================
-- Add a 4th frame choice: 'transparent' (no frame — item sits on the page).
-- Widens the frame check constraint on all three content tables.
-- Safe to re-run.
-- ============================================================================

alter table public.recent_work   drop constraint if exists recent_work_frame_check;
alter table public.recent_work   add constraint recent_work_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));

alter table public.gallery_items drop constraint if exists gallery_items_frame_check;
alter table public.gallery_items add constraint gallery_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));

alter table public.shop_items    drop constraint if exists shop_items_frame_check;
alter table public.shop_items    add constraint shop_items_frame_check
  check (frame in ('plain', 'gothic', 'ornate', 'transparent'));
