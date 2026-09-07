import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { frameClassName, imageCropStyle, listRecentWork } from "@/lib/content";
import heroTown from "@/assets/hero-town.jpg";
import giornoEmblem from "@/assets/giorno-emblem.svg";
import dollarBill from "@/assets/dollar_bill.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Toosh Tattoos — Bizarre Tattoo Studio" },
      {
        name: "description",
        content:
          "Toosh Tattoos is a tattoo studio for bold outlines, screentone shading and unbreakable design. Book a session.",
      },
      {
        property: "og:title",
        content: "Toosh Tattoos — Bizarre Tattoo Studio",
      },
      {
        property: "og:description",
        content:
          "Bold outlines, screentone shading, unbreakable design. Tattoo studio.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: works = [], isLoading } = useQuery({
    queryKey: ["recent_work"],
    queryFn: listRecentWork,
  });

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
          <h1 className="manga-outline font-jojo text-[clamp(3.5rem,12vw,9rem)] text-primary">
            TOOSH TATTOOS
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/90">
            TATTOOS IN CHICAGO
          </p>
          <div className="mt-9">
            <Link
              to="/contact"
              className="inline-flex border-4 border-ink bg-primary px-8 py-4 font-display text-lg uppercase text-primary-foreground shadow-[10px_10px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--ink)]"
            >
              Book a session
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section className="skew-strip relative -mt-6 overflow-hidden border-y-4 border-ink bg-primary py-3">
        <div className="marquee-right flex w-max items-center font-display text-xl uppercase tracking-[0.35em] text-primary-foreground">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-3 whitespace-nowrap pr-3"
              aria-hidden={i === 1}
            >
              Chicago Il ·
              <img
                src={giornoEmblem}
                alt={i === 0 ? "Giorno emblem" : ""}
                className="inline-block h-8 w-8 shrink-0"
              />
              Bookings Available ·
              <img
                src={dollarBill}
                alt={i === 0 ? "Toosh hundred dollar bill" : ""}
                className="inline-block h-7 w-auto shrink-0 border-2 border-ink"
              />
              @TooshTattoos ·
            </span>
          ))}
        </div>
      </section>

      {/* WORKS */}
      <section className="halftone bg-background">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-5xl text-primary">RECENT WORK</h2>
          {works.length > 0 ? (
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {works.map((w) => (
                <article
                  key={w.id}
                  className={`${frameClassName(w.frame)} overflow-hidden`}
                >
                  <img
                    src={w.image_url}
                    alt={w.title}
                    style={imageCropStyle(w)}
                    className="h-80 w-full border-b item-line object-cover"
                  />
                  <div className="p-5 font-uploaded">
                    <h3 className="text-2xl text-secondary">{w.title}</h3>
                    {w.meta && (
                      <p className="mt-1 text-sm uppercase tracking-[0.15em] text-muted-foreground">
                        {w.meta}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-12 border-4 border-ink bg-muted px-5 py-8 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {isLoading
                ? "Loading work…"
                : "No work posted yet — check back soon."}
            </p>
          )}
          <Link
            to="/gallery"
            className="mt-12 inline-block border-b-4 border-primary font-display text-lg uppercase text-primary"
          >
            See the full gallery →
          </Link>
        </div>
      </section>
    </main>
  );
}
