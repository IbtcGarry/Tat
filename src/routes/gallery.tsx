import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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

type Group = { id: string; name: string | null; items: GalleryItem[] };

const anchorId = (groupId: string) => `section-${groupId}`;

function Gallery() {
  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ["gallery_items"],
    queryFn: listGallery,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ["gallery_sections"],
    queryFn: listGallerySections,
  });

  // Every piece is on the page: one group per admin-made section, in their
  // order (empty ones skipped), then anything not filed in a section. With
  // no sections at all this is a single untitled grid.
  const known = new Set(sections.map((sec) => sec.id));
  const groups: Group[] = [
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
  const showNav = groups.length > 1;

  const navRef = useRef<HTMLElement>(null);
  const headerHeight = useSiteHeaderHeight();
  const current = useCurrentGroup(showNav ? groups : [], headerHeight);

  /** Smooth-scroll so the section's heading sits just under the jump bar. */
  function jumpTo(groupId: string | null) {
    const target = groupId ? document.getElementById(anchorId(groupId)) : null;
    const offset = headerHeight + (navRef.current?.offsetHeight ?? 0) + 16;
    const top = target
      ? target.getBoundingClientRect().top + window.scrollY - offset
      : 0;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          GALLERY
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          PEEP THE PROGRESS
        </p>

        {showNav && (
          <nav
            ref={navRef}
            aria-label="Jump to a section"
            style={{ top: headerHeight }}
            className="sticky z-40 -mx-5 mt-10 border-b-4 border-ink bg-background/95 px-5 py-3 backdrop-blur"
          >
            {/* One scrollable row on small screens, wraps on wide ones. */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
              <JumpButton
                label="All work"
                count={pieces.length}
                active={current === null}
                onClick={() => jumpTo(null)}
              />
              {groups.map((g) => (
                <JumpButton
                  key={g.id}
                  label={g.name ?? "More work"}
                  count={g.items.length}
                  active={current === g.id}
                  onClick={() => jumpTo(g.id)}
                />
              ))}
            </div>
          </nav>
        )}

        {groups.length > 0 ? (
          <>
            {groups.map((g) => (
              <section
                key={g.id}
                id={anchorId(g.id)}
                aria-label={g.name ?? "Gallery"}
                className="mt-14"
              >
                {g.name && (
                  <div className="flex items-baseline justify-between gap-4 border-b-4 border-ink pb-2">
                    <h2 className="text-[clamp(1.75rem,5vw,3rem)] text-primary">
                      {g.name}
                    </h2>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {g.items.length} piece{g.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                <PieceGrid pieces={g.items} />
              </section>
            ))}

            {showNav && (
              <div className="mt-16 text-center">
                <button
                  type="button"
                  onClick={() => jumpTo(null)}
                  className="border-4 border-ink bg-muted px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  ↑ Back to top
                </button>
              </div>
            )}
          </>
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

function JumpButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 whitespace-nowrap border-4 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
      }`}
    >
      {label}
      <span className="ml-2 opacity-60">{count}</span>
    </button>
  );
}

/** Height of the site's sticky header, so the jump bar can sit just below it. */
function useSiteHeaderHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return height;
}

/**
 * Which group the visitor is looking at: the last section whose heading has
 * scrolled up past the top third of the screen. Null while still above the
 * first section, which highlights "All work".
 */
function useCurrentGroup(groups: Group[], headerHeight: number): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  const ids = groups.map((g) => g.id).join("|");

  useEffect(() => {
    if (!ids) return;
    const list = ids.split("|");
    const update = () => {
      const line = headerHeight + window.innerHeight / 3;
      let found: string | null = null;
      for (const id of list) {
        const el = document.getElementById(anchorId(id));
        if (el && el.getBoundingClientRect().top <= line) found = id;
      }
      // At the very bottom, the last section counts even if it's short.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        found = list[list.length - 1] ?? found;
      }
      setCurrent(found);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids, headerHeight]);

  return current;
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
