import { createFileRoute } from "@tanstack/react-router";

import { MediaSlot } from "@/components/media-slot";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Toosh Tatoos" },
      {
        name: "description",
        content:
          "Studio goods, aftercare and appointment deposits from Toosh Tatoos.",
      },
      { property: "og:title", content: "Shop — Toosh Tatoos" },
      {
        property: "og:description",
        content:
          "Studio goods, aftercare and appointment deposits from Toosh Tatoos.",
      },
    ],
  }),
  component: Shop,
});

const products = [
  {
    sample: true,
    name: "Aftercare Kit",
    price: "¥3,500",
    tag: "Essential",
    desc: "Saniderm, unscented soap, aftercare balm and a zine on healing bold color.",
  },
  {
    sample: false,
    name: "Sticker Pack",
    price: "¥1,200",
    tag: "New",
    desc: "Five vinyl stickers: arrows, roses, skulls and the shop's name in katakana.",
  },
  {
    sample: false,
    name: "Studio Tote",
    price: "¥2,800",
    tag: "Gear",
    desc: "Heavy canvas bag with a two-color screen print. Carries a sketchbook and ink.",
  },
  {
    sample: false,
    name: "Appointment Deposit",
    price: "¥10,000",
    tag: "Booking",
    desc: "Holds your date. Applied in full to the final session price. Non-refundable.",
  },
];

function Shop() {
  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          SHOP
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Studio goods and booking essentials. Everything is printed or packed in
          Morioh and ships flat.
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <article key={`${p.name}-${i}`} className="panel flex flex-col">
              <div className="relative border-b-4 border-ink">
                <MediaSlot
                  sample={p.sample}
                  alt={p.name}
                  className="h-56 w-full"
                />
                <span className="absolute left-0 top-0 border-b-4 border-r-4 border-ink bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground">
                  {p.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-secondary">
                    {p.name}
                  </h2>
                  <span className="text-sm font-bold text-foreground">
                    {p.price}
                  </span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
                <button className="mt-5 w-full border-4 border-ink bg-primary px-4 py-3 font-display text-sm uppercase text-primary-foreground shadow-[6px_6px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)]">
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
