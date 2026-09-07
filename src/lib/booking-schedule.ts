import { addMinutes } from "date-fns";

import { SESSION_MINUTES, type BusyRange } from "./content";

/**
 * Studio schedule. Times are in the visitor's own local timezone — good enough
 * for a single-location studio; revisit if you ever take remote bookings.
 */
export const OPEN_DAYS = [2, 3, 4, 5, 6]; // 0 = Sun … 6 = Sat  →  Tue–Sat
export const SLOT_HOURS = [11, 12, 13, 14, 15, 16, 17, 18];

/** How many days ahead the public calendar lets you book. */
export const BOOKING_WINDOW_DAYS = 60;

export function isOpenDay(d: Date): boolean {
  return OPEN_DAYS.includes(d.getDay());
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
