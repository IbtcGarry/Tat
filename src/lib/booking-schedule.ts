import { addMinutes, format } from "date-fns";

import { SESSION_MINUTES, type BusyRange } from "./content";

/**
 * Studio schedule. Times are in the visitor's own local timezone — good enough
 * for a single-location studio; revisit if you ever take remote bookings.
 */
// 0 = Sun … 6 = Sat. Open every day by default — the studio closes individual
// dates from the admin page (see studio_closures).
export const OPEN_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const SLOT_HOURS = [11, 12, 13, 14, 15, 16, 17, 18];

/** How many days ahead the public calendar lets you book. */
export const BOOKING_WINDOW_DAYS = 60;

export function isOpenDay(d: Date): boolean {
  return OPEN_DAYS.includes(d.getDay());
}

/** Local calendar-day key, e.g. "2026-09-23" — matches studio_closures.day. */
export function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Candidate slot start times for one calendar day (local time). */
export function slotsForDay(day: Date): Date[] {
  return SLOT_HOURS.map((h) => {
    const d = new Date(day);
    d.setHours(h, 0, 0, 0);
    return d;
  });
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

/** Is `slot` (a SESSION_MINUTES appointment) blocked by any busy range? */
export function isSlotTaken(slot: Date, busy: BusyRange[]): boolean {
  const slotEnd = addMinutes(slot, SESSION_MINUTES);
  return busy.some((b) =>
    rangesOverlap(slot, slotEnd, new Date(b.starts_at), new Date(b.ends_at)),
  );
}

/** Session-length choices the admin picks from when confirming a booking. */
export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1½ hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2½ hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 300, label: "5 hours" },
  { value: 360, label: "6 hours" },
];

/** A Date → the value string a <input type="datetime-local"> expects (local time). */
export function toLocalInput(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/** A <input type="datetime-local"> value (local time, no zone) → Date. */
export function fromLocalInput(s: string): Date {
  return new Date(s);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
