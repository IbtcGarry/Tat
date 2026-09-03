import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { listShop } from "@/lib/content";

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

function Shop() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop_items"],
    queryFn: listShop,
  });

  return (
    <main className="halftone bg-background">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.75rem,8vw,6rem)] text-primary">
          SHOP
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Studio goods and booking essentials. Everything is printed or packed
          in Morioh and ships flat.
        </p>

        {products.length > 0 ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <article key={p.id} className="panel flex flex-col">
                <div className="relative border-b-4 border-ink">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-56 w-full object-cover"
                  />
                  {p.tag && (
                    <span className="absolute left-0 top-0 border-b-4 border-r-4 border-ink bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl text-secondary">
                      {p.name}
                    </h2>
                    {p.price && (
                      <span className="text-sm font-bold text-foreground">
                        {p.price}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  <button className="mt-5 w-full border-4 border-ink bg-primary px-4 py-3 font-display text-sm uppercase text-primary-foreground shadow-[6px_6px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)]">
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-14 border-4 border-ink bg-muted px-5 py-10 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {isLoading
              ? "Loading shop…"
              : "Nothing in the shop yet — check back soon."}
          </p>
        )}
      </div>
    </main>
  );
}
