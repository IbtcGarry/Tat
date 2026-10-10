-- ============================================================================
-- Gallery sections for Toosh Tatoos
--   * admins create, rename, reorder and delete named sections
--   * each gallery item can belong to one section (or none: "Unsorted")
--   * deleting a section keeps its tattoos; they just become unsorted
--
-- Requires 20260903000000_admin_content.sql (public.is_admin()). Safe to re-run.
-- ============================================================================

create table if not exists public.gallery_sections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 80),
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery_sections enable row level security;

drop policy if exists "gallery_sections public read" on public.gallery_sections;
create policy "gallery_sections public read"
  on public.gallery_sections for select
  using (true);

drop policy if exists "gallery_sections admin write" on public.gallery_sections;
create policy "gallery_sections admin write"
  on public.gallery_sections for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.gallery_items
  add column if not exists section_id uuid
  references public.gallery_sections (id) on delete set null;

create index if not exists gallery_items_section_id on public.gallery_items (section_id);
