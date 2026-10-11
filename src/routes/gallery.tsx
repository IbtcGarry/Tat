import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  frameClassName,
  imageCropStyle,
  listGallery,
  listGallerySections,
  type GalleryItem,
} from "@/lib/content";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Toosh Tattoos" },
      {
        name: "description",
        content: "Toosh Portfolio",
      },
      { property: "og:title", content: "Gallery — Toosh Tattoos" },
      {
        property: "og:description",
        content: "Toosh Portfolio",
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
  const { data: sections = [] } = useQuery({
    queryKey: ["gallery_sections"],
    queryFn: listGallerySections,
  });

  // One group per admin-made section, in their order (empty ones skipped),
  // then anything not filed in a section. With no sections at all this is a
  // single untitled grid, same as before sections existed.
  const known = new Set(sections.map((sec) => sec.id));
  const groups = [
    ...sections.map((sec) => ({
      id: sec.id,
      name: sec.name,
      items: pieces.filter((p) => p.section_id === sec.id),
    })),
    {
      id: "more",
      name: sections.length > 0 ? "More work" : null,
      items: pieces.filter((p) => !p.section_id || !known.has(p.section_id)),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          GALLERY
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          OPEN TO CHANGE I DIDNT KNOW WHAT TO PUT HERE
        </p>

        {groups.length > 1 && (
          <nav
            aria-label="Gallery sections"
            className="mt-10 flex flex-wrap gap-2"
          >
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#section-${g.id}`}
                className="border-4 border-ink bg-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {g.name}
              </a>
            ))}
          </nav>
        )}

        {groups.length > 0 ? (
          groups.map((g) => (
            <section
              key={g.id}
              id={`section-${g.id}`}
              className="mt-14 scroll-mt-24"
            >
              {g.name && (
                <h2 className="text-[clamp(1.75rem,5vw,3rem)] text-primary">
                  {g.name}
                </h2>
              )}
              <PieceGrid pieces={g.items} />
            </section>
          ))
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

function PieceGrid({ pieces }: { pieces: GalleryItem[] }) {
  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {pieces.map((p) => (
        <figure
          key={p.id}
          className={`${frameClassName(p.frame)} overflow-hidden`}
        >
          <img
            src={p.image_url}
            alt={p.title}
            style={imageCropStyle(p)}
            className="h-72 w-full border-b item-line object-cover"
          />
          <figcaption className="p-4 font-uploaded">
            <span className="block text-xl text-secondary">{p.title}</span>
            {p.meta && (
              <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                {p.meta}
              </span>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
