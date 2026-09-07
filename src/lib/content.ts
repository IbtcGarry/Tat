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
};

export type ShopItem = ImageCrop & {
  id: string;
  name: string;
  price: string | null;
  tag: string | null;
  description: string | null;
  image_url: string;
  frame: Frame;
};

export const BOOKING_STATUSES = [
  "new",
  "contacted",
  "booked",
  "declined",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  name: string;
  email: string;
  placement: string | null;
  idea: string | null;
  status: BookingStatus;
  created_at: string;
  /** Chosen appointment slot (ISO). Null for legacy contact-form requests. */
  starts_at: string | null;
  /** End of the slot (ISO), kept in sync server-side. */
  ends_at: string | null;
  duration_min: number;
};

/** Length of a single tattoo session, in minutes. */
export const SESSION_MINUTES = 120;

/** A time range that is already taken — no booker details, safe for the public page. */
export type BusyRange = { starts_at: string; ends_at: string };

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
export const listShop = () => list<ShopItem>("shop_items", "created_at");

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
  } & ImageCrop,
): Promise<void> {
  const { error } = await supabase.from("gallery_items").insert(input);
  if (error) throw error;
}

export async function addShopItem(
  input: {
    name: string;
    price: string;
    tag: string;
    description: string;
    image_url: string;
    frame: Frame;
  } & ImageCrop,
): Promise<void> {
  const { error } = await supabase.from("shop_items").insert(input);
  if (error) throw error;
}

export async function deleteContent(
  table: "recent_work" | "gallery_items" | "shop_items",
  id: string,
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// --- bookings --------------------------------------------------------------

/** Public: submit a booking request with a chosen date + time slot. */
export async function createBooking(input: {
  name: string;
  email: string;
  placement: string;
  idea: string;
  /** ISO timestamp of the chosen slot; null keeps the old "just a message" behaviour. */
  starts_at?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Booking is not available yet — Supabase isn't configured.",
    );
  }
  const { error } = await supabase.from("bookings").insert({
    ...input,
    starts_at: input.starts_at ?? null,
    duration_min: SESSION_MINUTES,
  });
  if (error) {
    // Exclusion-constraint violation → someone grabbed the slot first.
    if (error.code === "23P01" || /bookings_no_overlap/.test(error.message)) {
      throw new Error(
        "That time was just booked by someone else — please pick another slot.",
      );
    }
    throw error;
  }
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

// --- studio closures -----------------------------------------------------

export type Closure = { day: string; reason: string | null };

/** All closed calendar days (YYYY-MM-DD), soonest first. Public. */
export async function listClosures(): Promise<Closure[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("studio_closures")
    .select("day, reason")
    .order("day");
  if (error) throw error;
  return (data as Closure[]) ?? [];
}

/** Admin: close a day so nobody can book it (RLS enforced). */
export async function addClosure(day: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("studio_closures")
    .upsert({ day, reason: reason || null });
  if (error) throw error;
}

/** Admin: reopen a previously closed day (RLS enforced). */
export async function removeClosure(day: string): Promise<void> {
  const { error } = await supabase
    .from("studio_closures")
    .delete()
    .eq("day", day);
  if (error) throw error;
}

/** Busy time ranges between two ISO timestamps (via the SECURITY DEFINER RPC). */
export async function listBookedRanges(
  fromIso: string,
  toIso: string,
): Promise<BusyRange[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("booked_slots", {
    from_ts: fromIso,
    to_ts: toIso,
  });
  if (error) throw error;
  return (data as BusyRange[]) ?? [];
}

/** Admin only (RLS enforced): every booking request, newest first. */
export async function listBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

/** The signed-in user's own booking requests, matched by email (RLS enforced). */
export async function listMyBookings(email: string): Promise<Booking[]> {
  if (!isSupabaseConfigured || !email) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .ilike("email", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Admin: confirm a request at a chosen start time + duration. This is what
 * actually reserves the slot — status becomes 'booked' and the DB exclusion
 * constraint blocks it from overlapping any other confirmed booking.
 */
export async function acceptBooking(
  id: string,
  startIso: string,
  durationMin: number,
): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({
      starts_at: startIso,
      duration_min: durationMin,
      status: "booked" satisfies BookingStatus,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23P01" || /bookings_no_overlap/.test(error.message)) {
      throw new Error(
        "That time overlaps another confirmed booking — pick a different time or length.",
      );
    }
    throw error;
  }
}
