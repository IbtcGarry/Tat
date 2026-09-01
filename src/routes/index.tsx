import { createFileRoute, Link } from "@tanstack/react-router";

import { MediaSlot } from "@/components/media-slot";
import heroTown from "@/assets/hero-town.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Toosh Tatoos — Bizarre Tattoo Studio" },
      {
        name: "description",
        content:
          "Toosh Tatoos is a tattoo studio for bold outlines, screentone shading and unbreakable design. Book a session.",
      },
      { property: "og:title", content: "Toosh Tatoos — Bizarre Tattoo Studio" },
      {
        property: "og:description",
        content: "Bold outlines, screentone shading, unbreakable design. Tattoo studio.",
      },
    ],
  }),
  component: Index,
});

const works = [
  { sample: true, title: "Golden Arrow", meta: "Forearm · blackwork + gold" },
  { sample: false, title: "Crazy Diamond", meta: "Full back · 3 sessions" },
  { sample: false, title: "Kira Roses", meta: "Hand · pink & thorn" },
];

function Index() {
  return (
    <main>
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b-4 border-ink">
        <img
          src={heroTown}
          alt="Sunset street in a quiet Japanese suburb"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="relative mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center px-5 py-24">
          <p className="mb-4 inline-flex w-fit border-4 border-ink bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-accent-foreground">
            Tattoo studio
          </p>
          <h1 className="manga-outline text-[clamp(3.5rem,12vw,9rem)] text-primary">
            TOOSH TATOOS
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/90">
            Nothing here is ordinary. Heavy outlines, screentone shadows and
            colors that shouldn't work together — permanently, on skin.
          </p>
          <div className="mt-9">
            <Link
              to="/contact"
              className="inline-flex border-4 border-ink bg-secondary px-8 py-4 font-display text-lg uppercase text-secondary-foreground shadow-[10px_10px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--ink)]"
            >
              Book a session
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section className="skew-strip -mt-6 border-y-4 border-ink bg-primary py-3">
        <p className="whitespace-nowrap text-center font-display text-xl uppercase tracking-[0.35em] text-primary-foreground">
          ゴゴゴゴ · bold lines · unbreakable · ゴゴゴゴ · bold lines · unbreakable
        </p>
      </section>

      {/* WORKS */}
      <section className="halftone bg-background">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-5xl text-primary">RECENT WORK</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {works.map((w) => (
              <article key={w.title} className="panel">
                <MediaSlot
                  sample={w.sample}
                  alt={w.title}
                  className="h-80 w-full border-b-4 border-ink"
                />
                <div className="p-5">
                  <h3 className="text-2xl text-secondary">{w.title}</h3>
                  <p className="mt-1 text-sm uppercase tracking-[0.15em] text-muted-foreground">
                    {w.meta}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <Link
            to="/gallery"
            className="mt-12 inline-block border-b-4 border-primary font-display text-lg uppercase text-primary"
          >
            See the full gallery →
          </Link>
        </div>
      </section>

      {/* STUDIO */}
      <section className="speed-lines border-t-4 border-ink bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-2">
          <h2 className="text-5xl text-secondary-foreground">
            A QUIET TOWN.
            <br />
            LOUD TATTOOS.
          </h2>
          <div className="space-y-5 text-lg text-secondary-foreground/90">
            <p>
              We work out of a small shop behind the Owson on Budogaoka. Three
              stations, one machine each, no rushed appointments.
            </p>
            <p>
              Every piece starts as a hand-inked drawing. If the design doesn't
              feel strange enough to stop someone on the street, we redraw it.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
