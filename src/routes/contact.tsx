import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { createBooking, listBookedRanges, listClosures } from "@/lib/content";
import {
  BOOKING_WINDOW_DAYS,
  dayKey,
  endOfDay,
  isOpenDay,
  isSlotTaken,
  slotsForDay,
  startOfDay,
} from "@/lib/booking-schedule";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Book a Session — Toosh Tattoos" },
      {
        name: "description",
        content:
          "Pick a date and time for your tattoo consultation at Toosh Tattoos, then tell us the placement, size and idea.",
      },
      { property: "og:title", content: "Book a Session — Toosh Tattoos" },
      {
        property: "og:description",
        content:
          "Pick a date and time for a tattoo consultation at Toosh Tattoos.",
      },
    ],
  }),
  component: Contact,
});

const textFields = [
  { id: "name", label: "First & last name", type: "text" },
  { id: "email", label: "Email address", type: "email" },
  { id: "placement", label: "Placement & size", type: "text" },
] as const;

const emptyForm = { name: "", email: "", placement: "", idea: "" };

const labelClass =
  "block text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground";
const fieldClass =
  "mt-2 w-full border border-ink/50 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [date, setDate] = useState<Date | undefined>();
  const [slotIso, setSlotIso] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, BOOKING_WINDOW_DAYS);

  const closures = useQuery({ queryKey: ["closures"], queryFn: listClosures });
  const closedDays = useMemo(
    () => new Set((closures.data ?? []).map((c) => c.day)),
    [closures.data],
  );

  const busy = useQuery({
    queryKey: ["booked-ranges", date ? format(date, "yyyy-MM-dd") : null],
    enabled: Boolean(date),
    queryFn: () =>
      listBookedRanges(
        startOfDay(date!).toISOString(),
        endOfDay(date!).toISOString(),
      ),
  });

  const slots = useMemo(() => {
    if (!date) return [];
    const now = new Date();
    return slotsForDay(date).map((slot) => ({
      iso: slot.toISOString(),
      label: format(slot, "h:mm a"),
      disabled:
        slot.getTime() < now.getTime() || isSlotTaken(slot, busy.data ?? []),
    }));
  }, [date, busy.data]);

  const mutation = useMutation({
    mutationFn: () => createBooking({ ...form, starts_at: slotIso }),
    onSuccess: () => {
      setForm(emptyForm);
      setDate(undefined);
      setSlotIso(null);
    },
    onError: () => {
      // A lost-the-race error means our availability is stale.
      void busy.refetch();
      setSlotIso(null);
    },
  });

  const ready =
    Boolean(slotIso) &&
    form.name.trim() &&
    form.email.trim() &&
    form.placement.trim() &&
    form.idea.trim();

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="manga-outline text-center text-[clamp(2rem,6vw,3.5rem)] text-primary">
          BOOK A SESSION
        </h1>

        <form
          className="panel mt-8 overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) mutation.mutate();
          }}
        >
          {/* summary banner */}
          <div className="flex items-center justify-between gap-4 bg-ink px-5 py-4">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.15em] text-primary">
                {slotIso
                  ? format(new Date(slotIso), "EEEE d MMMM")
                  : "Tattoo session"}
              </p>
              <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                {slotIso
                  ? `${format(new Date(slotIso), "h:mm a")} · studio sets final length`
                  : "Open daily · 11:00 – 20:00"}
              </p>
            </div>
            <span className="shrink-0 font-display text-xs uppercase tracking-[0.15em] text-foreground/60">
              ~2 hours
            </span>
          </div>

          {/* date + time */}
          <div className="p-5">
            <h2 className="font-display text-xl uppercase tracking-[0.05em] text-primary">
              {date ? format(date, "MMMM d") : "Pick a date"}
            </h2>

            <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr]">
              <div className="border border-ink/40 bg-background">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d ?? undefined);
                    setSlotIso(null);
                  }}
                  disabled={[
                    { before: today },
                    { after: maxDate },
                    (d: Date) => !isOpenDay(d) || closedDays.has(dayKey(d)),
                  ]}
                  className="mx-auto"
                />
              </div>

              <div>
                <span className={labelClass}>
                  {date ? "Select a time" : "Time"}
                </span>
                {!date ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Pick a date to see open times.
                  </p>
                ) : busy.isLoading ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Checking availability…
                  </p>
                ) : slots.every((s) => s.disabled) ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No open times that day — try another date.
                  </p>
                ) : (
                  <div className="mt-2 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {slots.map((s) => {
                      const active = s.iso === slotIso;
                      return (
                        <button
                          key={s.iso}
                          type="button"
                          disabled={s.disabled}
                          onClick={() => setSlotIso(s.iso)}
                          className={`border px-3 py-2 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : s.disabled
                                ? "border-ink/20 text-muted-foreground/40 line-through"
                                : "border-ink/50 text-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* fine print */}
          <p className="border-t border-ink/40 px-5 py-3 text-[0.68rem] uppercase leading-relaxed tracking-[0.15em] text-muted-foreground">
            This sends a request for your preferred time. The studio sets the
            final start and session length and confirms by email.
          </p>

          {/* details */}
          <div className="border-t border-ink/40 p-5">
            <h3 className="font-display text-xl uppercase tracking-[0.05em] text-primary">
              Add your details
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                {textFields.map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className={labelClass}>
                      {f.label}
                    </label>
                    <input
                      id={f.id}
                      type={f.type}
                      required
                      value={form[f.id]}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, [f.id]: e.target.value }))
                      }
                      className={fieldClass}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <label htmlFor="idea" className={labelClass}>
                  The idea
                </label>
                <textarea
                  id="idea"
                  required
                  value={form.idea}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, idea: e.target.value }))
                  }
                  className={`${fieldClass} min-h-40 flex-1 resize-y`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={mutation.isPending || !ready}
                className="border-2 border-ink bg-primary px-8 py-3 font-display text-base uppercase tracking-[0.1em] text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_var(--ink)] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {mutation.isPending ? "Sending…" : "Next"}
              </button>
              {!ready && !mutation.isPending && (
                <span className="text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {slotIso ? "Fill in your details" : "Pick a date & time"}
                </span>
              )}
            </div>

            {mutation.isSuccess && (
              <p className="mt-4 border border-ink px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                Request sent — we confirm your session by email within two days.
              </p>
            )}
            {mutation.isError && (
              <p className="mt-4 border border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Could not send — try again."}
              </p>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          Toosh Tattoos · Chicago, IL · deposit due at booking
        </p>
      </div>
    </main>
  );
}
