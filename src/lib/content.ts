import { supabase, isSupabaseConfigured } from "./supabase";

export type RecentWork = {
  id: string;
  title: string;
  meta: string | null;
  image_url: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  meta: string | null;
  image_url: string;
};

export type ShopItem = {
  id: string;
  name: string;
  price: string | null;
  tag: string | null;
  description: string | null;
  image_url: string;
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
export const listShop = () => list<ShopItem>("shop_items", "created_at");

export async function addRecentWork(input: {
  title: string;
  meta: string;
  image_url: string;
}): Promise<void> {
  const { error } = await supabase.from("recent_work").insert(input);
  if (error) throw error;
}

export async function addGalleryItem(input: {
  title: string;
  meta: string;
  image_url: string;
}): Promise<void> {
  const { error } = await supabase.from("gallery_items").insert(input);
  if (error) throw error;
}

export async function addShopItem(input: {
  name: string;
  price: string;
  tag: string;
  description: string;
  image_url: string;
}): Promise<void> {
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

/** Public: submit a booking request from the contact form. */
export async function createBooking(input: {
  name: string;
  email: string;
  placement: string;
  idea: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Booking is not available yet — Supabase isn't configured.",
    );
  }
  const { error } = await supabase.from("bookings").insert(input);
  if (error) throw error;
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
