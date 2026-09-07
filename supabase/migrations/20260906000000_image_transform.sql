-- ============================================================================
-- Per-item image crop: a zoom factor + focal point (percent on each axis),
-- set by the admin when uploading and replayed on the public pages via
-- object-position / transform: scale().
-- Safe to re-run.
-- ============================================================================

alter table public.recent_work   add column if not exists scale   real not null default 1;
alter table public.recent_work   add column if not exists focus_x  real not null default 50;
alter table public.recent_work   add column if not exists focus_y  real not null default 50;

alter table public.gallery_items add column if not exists scale   real not null default 1;
alter table public.gallery_items add column if not exists focus_x  real not null default 50;
alter table public.gallery_items add column if not exists focus_y  real not null default 50;

alter table public.shop_items    add column if not exists scale   real not null default 1;
alter table public.shop_items    add column if not exists focus_x  real not null default 50;
alter table public.shop_items    add column if not exists focus_y  real not null default 50;
