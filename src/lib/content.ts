import type { CSSProperties } from "react";

import { supabase, isSupabaseConfigured } from "./supabase";

export const FRAME_OPTIONS = [
  { value: "plain", label: "Plain", className: "item-frame-plain" },
  { value: "gothic", label: "Gothic", className: "item-frame-gothic" },
  { value: "ornate", label: "Ornate", className: "item-frame-ornate" },
  {
    value: "transparent",
    label: "Transparent",
    className: "item-frame-transparent",
  },
] as const;

export type Frame = (typeof FRAME_OPTIONS)[number]["value"];

/** Tailwind class for an item's chosen frame, falling back to plain. */
export function frameClassName(frame: string | null | undefined): string {
  return (
    FRAME_OPTIONS.find((f) => f.value === frame)?.className ??
    "item-frame-plain"
  );
}

/** How the admin cropped the image: zoom + focal point (0–100 % on each axis). */
export type ImageCrop = {
  scale: number;
  focus_x: number;
  focus_y: number;
};

/**
 * Inline style for an `object-cover` <img>, reproducing the admin's crop:
 * `object-position` picks the visible region, `scale()` zooms toward it.
 * Column values may arrive as strings (Postgres `real`), so coerce.
 */
export function imageCropStyle(row: Partial<ImageCrop>): CSSProperties {
  const scale = Number(row.scale ?? 1) || 1;
  const x = Number(row.focus_x ?? 50);
  const y = Number(row.focus_y ?? 50);
  const style: CSSProperties = { objectPosition: `${x}% ${y}%` };
  if (scale !== 1) {
    style.transform = `scale(${scale})`;
    style.transformOrigin = `${x}% ${y}%`;
  }
  return style;
}

export type RecentWork = ImageCrop & {
  id: string;
  title: string;
  meta: string | null;
  image_url: string;
  frame: Frame;
};

export type GalleryItem = ImageCrop & {
  id: string;
  title: string;
  meta: string | null;
  image_url: string;
  frame: Frame;
  /** The admin-made section it's shown under; null = not in a section. */
  section_id: string | null;
};

/** A named group on the Gallery page, made and ordered by admins. */
export type GallerySection = {
  id: string;
  name: string;
  sort: number;
};

/** Upload an image to the public `media` bucket and return its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

async function list<T>(table: string, order: string): Promise<T[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from(table).select("*").order(order);
  if (error) throw error;
  return (data as T[]) ?? [];
}

export const listRecentWork = () => list<RecentWork>("recent_work", "sort");
export const listGallery = () =>
  list<GalleryItem>("gallery_items", "created_at");
export const listGallerySections = () =>
  list<GallerySection>("gallery_sections", "sort");

export async function addRecentWork(
  input: {
    title: string;
    meta: string;
    image_url: string;
    frame: Frame;
  } & ImageCrop,
): Promise<void> {
  const { error } = await supabase.from("recent_work").insert(input);
  if (error) throw error;
}

export async function addGalleryItem(
  input: {
    title: string;
    meta: string;
    image_url: string;
    frame: Frame;
    section_id: string | null;
  } & ImageCrop,
): Promise<void> {
  const { error } = await supabase.from("gallery_items").insert(input);
  if (error) throw error;
}

export async function deleteContent(
  table: "recent_work" | "gallery_items",
  id: string,
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// --- team / roles (master admin only) -----------------------------------

export type TeamMember = {
  email: string;
  username: string | null;
  role: "user" | "admin" | "master";
  created_at: string;
};

/** Master only: every account with its email + role (RLS/RPC enforced). */
export async function listTeam(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("list_user_roles");
  if (error) throw error;
  return (data as TeamMember[]) ?? [];
}

/** Master only: grant ('admin') or revoke ('user') admin on an account by email. */
export async function setUserRole(
  email: string,
  role: "user" | "admin",
): Promise<void> {
  const { error } = await supabase.rpc("set_user_role", {
    target_email: email,
    new_role: role,
  });
  if (error) {
    const m = error.message || "";
    if (/no account/i.test(m))
      throw new Error(
        "No account with that email — they need to sign up first.",
      );
    if (/is a master admin/i.test(m))
      throw new Error("That account is a master admin — change it in SQL.");
    if (/only master admins/i.test(m))
      throw new Error("Only master admins can change roles.");
    throw error;
  }
}

// --- gallery sections ------------------------------------------------------

/** Admin: file a gallery item under a section (null = no section). */
export async function setGalleryItemSection(
  id: string,
  section_id: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("gallery_items")
    .update({ section_id })
    .eq("id", id);
  if (error) throw error;
}

/** Admin: add a section at the end of the list (RLS enforced). */
export async function addGallerySection(
  name: string,
  sort: number,
): Promise<void> {
  const { error } = await supabase
    .from("gallery_sections")
    .insert({ name: name.trim(), sort });
  if (error) throw error;
}

export async function renameGallerySection(
  id: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("gallery_sections")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw error;
}

/** Admin: save this order as each section's `sort`. */
export async function saveGallerySectionOrder(ids: string[]): Promise<void> {
  const results = await Promise.all(
    ids.map((id, sort) =>
      supabase.from("gallery_sections").update({ sort }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** Admin: delete a section. Its tattoos stay in the gallery, just unsectioned. */
export async function deleteGallerySection(id: string): Promise<void> {
  const { error } = await supabase
    .from("gallery_sections")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
