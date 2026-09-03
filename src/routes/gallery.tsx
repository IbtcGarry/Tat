import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { listGallery } from "@/lib/content";

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
        content:
          "Blackwork, screentone shading and saturated color tattoo pieces.",
      },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ["gallery_items"],
    queryFn: listGallery,
  });

  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          GALLERY
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Every piece is drawn in-house — no flash sheets, no copies of someone
          else's work.
        </p>

        {pieces.length > 0 ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pieces.map((p) => (
              <figure key={p.id} className="panel">
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="h-72 w-full border-b-4 border-ink object-cover"
                />
                <figcaption className="p-4">
                  <span className="block font-display text-xl text-secondary">
                    {p.title}
                  </span>
                  {p.meta && (
                    <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                      {p.meta}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-14 border-4 border-ink bg-muted px-5 py-10 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {isLoading
              ? "Loading gallery…"
              : "The gallery is empty right now — check back soon."}
          </p>
        )}
      </div>
    </main>
  );
}
