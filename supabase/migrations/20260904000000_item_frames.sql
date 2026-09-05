-- ============================================================================
-- Frame choice for uploaded items
--   Admins pick one of 3 display frames when uploading to Recent Work,
--   Gallery or Shop. Stored per-row, read by the public pages.
-- Safe to re-run.
-- ============================================================================

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
