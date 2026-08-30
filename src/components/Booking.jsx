import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Skull } from "./Doodles";

const ARTISTS = ["First Available", "Vic Toosh", "Elena Vane", "Marcus Blade"];

const empty = { name: "", contact: "", artist: "First Available", preferred_date: "", idea: "" };

export function Booking() {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/bookings", form);
      toast.success("Request received. We'll hit you back within 48 hours to lock your slot.");
      setForm(empty);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="booking" className="spotlight relative py-24 sm:py-32" data-testid="booking-section">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="lg:sticky lg:top-28"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Your Turn</p>
          <h2 className="mt-3 font-display text-5xl tracking-tight text-bone sm:text-6xl lg:text-7xl">
            GET <span className="text-blood">INKED</span>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-sepia">
            Drop your concept below. We review every request by hand and come back with a quote, a slot, and an honest
            take on placement. Deposits lock the date — no deposit, no encore.
          </p>
          <div className="mt-10 space-y-3 font-mono text-xs uppercase tracking-[0.25em] text-bone/50">
            <p>2124 W Division St — Wicker Park, Chicago</p>
            <p>Tue–Sun / 12pm–10pm</p>
            <p className="text-acid">Replies within 48 hours</p>
          </div>
          <Skull className="mt-12 hidden h-24 w-24 text-blood/40 lg:block" />
        </motion.div>

        <motion.form
          data-testid="booking-form"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          onSubmit={submit}
          className="ink-frame spotlight-card relative rotate-[0.5deg] bg-elevated p-6 sm:p-10"
        >
          <span className="tape absolute -top-3 left-8 -rotate-2">Booking request</span>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-sepia">Full name *</span>
              <input
                data-testid="booking-form-name-input"
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Johnny Rotten"
                className="input-punk"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-sepia">Email or phone *</span>
              <input
                data-testid="booking-form-contact-input"
                required
                value={form.contact}
                onChange={set("contact")}
                placeholder="you@loud.com / 312-555-0199"
                className="input-punk"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-sepia">Preferred artist</span>
              <select
                data-testid="booking-form-artist-select"
                value={form.artist}
                onChange={set("artist")}
                className="input-punk"
              >
                {ARTISTS.map((a) => (
                  <option key={a} value={a} className="bg-ink">
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-sepia">Preferred date *</span>
              <input
                data-testid="booking-form-date-picker"
                required
                type="date"
                value={form.preferred_date}
                onChange={set("preferred_date")}
                className="input-punk [color-scheme:dark]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-sepia">
                Tattoo idea, placement &amp; size *
              </span>
              <textarea
                data-testid="booking-form-idea-textarea"
                required
                rows={5}
                value={form.idea}
                onChange={set("idea")}
                placeholder="Traditional skull with a Flying V through it, outer forearm, ~6 inches…"
                className="input-punk resize-none"
              />
            </label>
          </div>
          <button
            data-testid="booking-form-submit-button"
            type="submit"
            disabled={sending}
            className="menu-ribbon mt-8 w-full bg-blood py-4 font-display text-2xl tracking-[0.2em] text-white transition-all duration-300 hover:bg-acid hover:text-void disabled:opacity-50"
          >
            {sending ? "SENDING…" : "REQUEST MY SLOT"}
          </button>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-bone/30">
            18+ only. ID required at the chair.
          </p>
        </motion.form>
      </div>
    </section>
  );
}
