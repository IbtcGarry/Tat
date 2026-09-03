import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { MediaSlot } from "@/components/media-slot";
import { createBooking } from "@/lib/content";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Book a Session — Toosh Tatoos" },
      {
        name: "description",
        content:
          "Request a tattoo consultation at Toosh Tatoos. Tell us the placement, size and idea, and we'll reply with a quote.",
      },
      { property: "og:title", content: "Book a Session — Toosh Tatoos" },
      {
        property: "og:description",
        content: "Request a tattoo consultation at Toosh Tatoos.",
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

function Contact() {
  const [form, setForm] = useState(emptyForm);

  const mutation = useMutation({
    mutationFn: () => createBooking(form),
    onSuccess: () => setForm(emptyForm),
  });

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
              <dd className="text-foreground">4-2 Budogaoka</dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.25em] text-secondary">
                Hours
              </dt>
              <dd className="text-foreground">Tue – Sun · 13:00 – 22:00</dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.25em] text-secondary">
                Deposit
              </dt>
              <dd className="text-foreground">
                ¥10,000, goes toward the final price
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
              Latest studio snapshot
            </figcaption>
          </figure>
        </div>

        <form
          className="panel space-y-5 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          {textFields.map((f) => (
            <div key={f.id}>
              <label
                htmlFor={f.id}
                className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
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
                className="mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
              />
            </div>
          ))}
          <div>
            <label
              htmlFor="idea"
              className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            >
              The idea
            </label>
            <textarea
              id="idea"
              rows={5}
              required
              value={form.idea}
              onChange={(e) => setForm((s) => ({ ...s, idea: e.target.value }))}
              className="mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full border-4 border-ink bg-primary px-6 py-4 font-display text-lg uppercase text-primary-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60"
          >
            {mutation.isPending ? "Sending…" : "Send request"}
          </button>
          {mutation.isSuccess && (
            <p className="border-4 border-ink bg-secondary px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-secondary-foreground">
              Request received — we reply within two days.
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
