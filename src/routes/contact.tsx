import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";

import { MediaSlot } from "@/components/media-slot";
import { Calendar } from "@/components/ui/calendar";
import { createBooking, listBookedRanges } from "@/lib/content";
import {
  BOOKING_WINDOW_DAYS,
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
  { id: "name", label: "Name", type: "text" },
  { id: "email", label: "Email", type: "email" },
  { id: "placement", label: "Placement & size", type: "text" },
] as const;

const emptyForm = { name: "", email: "", placement: "", idea: "" };

const fieldClass =
  "mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary";
const labelClass =
  "block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground";

function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [date, setDate] = useState<Date | undefined>();
  const [slotIso, setSlotIso] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, BOOKING_WINDOW_DAYS);

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
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
            BOOK A<br />
            SESSION
          </h1>
          <dl className="mt-10 space-y-6 text-lg">
            <div>
              <dt className="text-sm uppercase tracking-[0.25em] text-secondary">
                Studio
              </dt>
              <dd className="text-foreground">
                OPEN TO CHANGE I DIDNT KNOW WHAT TO PUT HERE
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.25em] text-secondary">
                Hours
              </dt>
              <dd className="text-foreground">
                Tue–Sat · 11:00 – 20:00 · sessions run ~2 hours
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.25em] text-secondary">
                Deposit
              </dt>
              <dd className="text-foreground">
                OPEN TO CHANGE I DIDNT KNOW WHAT TO PUT HERE
              </dd>
            </div>
          </dl>
          <figure className="panel mt-10">
            <MediaSlot
              sample
              alt="Studio sample photo"
              className="h-72 w-full border-b-4 border-ink"
            />
            <figcaption className="p-4 text-sm uppercase tracking-[0.15em] text-muted-foreground">
              OPEN TO CHANGE I DIDNT KNOW WHAT TO PUT HERE
            </figcaption>
          </figure>
        </div>

        <form
          className="panel space-y-6 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) mutation.mutate();
          }}
        >
          <div>
            <span className={labelClass}>Pick a date</span>
            <div className="mt-2 border-4 border-ink bg-background">
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
                  (d: Date) => !isOpenDay(d),
                ]}
                className="mx-auto"
              />
            </div>
          </div>

          {date && (
            <div>
              <span className={labelClass}>
                Pick a time — {format(date, "EEE d MMM")}
              </span>
              {busy.isLoading ? (
                <p className="mt-2 text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  Checking availability…
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => {
                    const active = s.iso === slotIso;
                    return (
                      <button
                        key={s.iso}
                        type="button"
                        disabled={s.disabled}
                        onClick={() => setSlotIso(s.iso)}
                        className={`border-4 px-2 py-2 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
                          active
                            ? "border-ink bg-primary text-primary-foreground"
                            : s.disabled
                              ? "border-ink/30 text-muted-foreground line-through"
                              : "border-ink bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {!busy.isLoading && slots.every((s) => s.disabled) && (
                <p className="mt-2 text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  No open slots that day — try another date.
                </p>
              )}
            </div>
          )}

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
          <div>
            <label htmlFor="idea" className={labelClass}>
              The idea
            </label>
            <textarea
              id="idea"
              rows={5}
              required
              value={form.idea}
              onChange={(e) => setForm((s) => ({ ...s, idea: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            This sends a request for your preferred time. The studio sets the
            final start and session length and confirms by email.
          </p>
          <button
            type="submit"
            disabled={mutation.isPending || !ready}
            className="w-full border-4 border-ink bg-primary px-6 py-4 font-display text-lg uppercase text-primary-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60"
          >
            {mutation.isPending
              ? "Sending…"
              : slotIso
                ? `Request ${format(new Date(slotIso), "EEE d MMM · h:mm a")}`
                : "Pick a date & time"}
          </button>
          {mutation.isSuccess && (
            <p className="border-4 border-ink bg-background px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
              Request sent — we confirm your session by email within two days.
            </p>
          )}
          {mutation.isError && (
            <p className="border-4 border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Could not send — try again."}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
