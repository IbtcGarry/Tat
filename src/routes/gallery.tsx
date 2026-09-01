import { createFileRoute } from "@tanstack/react-router";

import { MediaSlot } from "@/components/media-slot";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Toosh Tatoos" },
      {
        name: "description",
        content:
          "Healed and fresh tattoo work from Toosh Tatoos: blackwork, screentone shading, and saturated color pieces.",
      },
      { property: "og:title", content: "Gallery — Toosh Tatoos" },
      {
        property: "og:description",
        content: "Blackwork, screentone shading and saturated color tattoo pieces.",
      },
    ],
  }),
  component: Gallery,
});

const pieces = [
  { sample: true, title: "Golden Arrow", meta: "Forearm · 5 hours" },
  { sample: false, title: "Crazy Diamond", meta: "Full back · 3 sessions" },
  { sample: false, title: "Kira Roses", meta: "Hand · 4 hours" },
  { sample: false, title: "Bad Company", meta: "Ribs · blackwork" },
  { sample: false, title: "Sheer Heart", meta: "Sternum · color" },
  { sample: false, title: "Stray Cat", meta: "Calf · linework" },
];

function Gallery() {
  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          GALLERY
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Six recent pieces. Everything is drawn in-house — no flash sheets, no
          copies of someone else's work.
        </p>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((p, i) => (
            <figure key={`${p.title}-${i}`} className="panel">
              <MediaSlot
                sample={p.sample}
                alt={p.title}
                className="h-72 w-full border-b-4 border-ink"
              />
              <figcaption className="p-4">
                <span className="block font-display text-xl text-secondary">
                  {p.title}
                </span>
                <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  {p.meta}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}
