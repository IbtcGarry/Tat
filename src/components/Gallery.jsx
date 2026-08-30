import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { api, imageUrl } from "../lib/api";

const CATEGORIES = [
  "All",
  "Traditional",
  "Black & Grey",
  "Neo-Traditional",
  "Flash",
  "Fine Line",
];

const TESTIDS = {
  All: "gallery-filter-all",
  Traditional: "gallery-filter-traditional",
  "Black & Grey": "gallery-filter-black-grey",
  "Neo-Traditional": "gallery-filter-neo-traditional",
  Flash: "gallery-filter-flash",
  "Fine Line": "gallery-filter-fine-line",
};

const ROTATIONS = [
  "-rotate-1",
  "rotate-1",
  "-rotate-[1.5deg]",
  "rotate-[0.75deg]",
];

export function Gallery() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);

  useEffect(() => {
    api
      .get("/gallery")
      .then((r) => {
        const data = Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.data?.gallery)
          ? r.data.gallery
          : Array.isArray(r.data?.items)
          ? r.data.items
          : [];

        setPieces(data);
      })
      .catch(() => {
        setPieces([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const visible = useMemo(() => {
    const safePieces = Array.isArray(pieces) ? pieces : [];

    return filter === "All"
      ? safePieces
      : safePieces.filter((p) => p.category === filter);
  }, [pieces, filter]);

  const bookSimilar = () => {
    setActive(null);

    document
      .querySelector("#booking")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="work"
      className="relative py-24 sm:py-32"
      data-testid="gallery-section"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
            The Setlist
          </p>

          <h2 className="mt-3 font-display text-5xl tracking-tight text-bone sm:text-6xl lg:text-7xl">
            PROOF OF <span className="text-blood">NOISE</span>
          </h2>

          <p className="mt-4 max-w-lg text-sepia">
            The wall is being restocked — real pieces straight from the chair
            land here first. Watch this space.
          </p>
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              data-testid={TESTIDS[c]}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                filter === c
                  ? "menu-ribbon bg-blood text-white"
                  : "border border-bone/15 text-bone/60 hover:border-acid/50 hover:text-acid"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p
            className="mt-16 font-mono text-sm text-sepia"
            data-testid="gallery-loading"
          >
            Loading the setlist…
          </p>
        ) : visible.length === 0 ? (
          filter === "All" ? (
            <div
              className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
              data-testid="gallery-empty"
            >
              {["01", "02", "03"].map((n, i) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`ink-frame relative bg-elevated/40 p-3 ${
                    ROTATIONS[i % 4]
                  }`}
                >
                  <span className="tape absolute left-3 top-3 z-10 -rotate-2">
                    Piece {n}
                  </span>

                  <div className="flex aspect-[4/5] w-full items-center justify-center border border-dashed border-bone/15">
                    <p className="px-6 text-center font-mono text-[11px] uppercase leading-loose tracking-[0.25em] text-sepia/70">
                      Fresh ink
                      <br />
                      dropping soon
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              className="mt-16 font-mono text-sm text-sepia"
              data-testid="gallery-empty-filter"
            >
              Nothing in this style yet — check back after the next session.
            </p>
          )
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <motion.button
                key={p.id ?? i}
                data-testid="gallery-card-item"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.1,
                }}
                onClick={() => setActive(p)}
                className={`group ink-frame spotlight-card relative bg-elevated p-3 text-left transition-transform duration-500 hover:z-10 hover:scale-[1.03] hover:rotate-0 ${
                  ROTATIONS[i % 4]
                }`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={imageUrl(p.image_url)}
                    alt={p.title || "Tattoo artwork"}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30" />

                  <span className="tape absolute left-3 top-3 -rotate-2">
                    {p.category}
                  </span>
                </div>

                <div className="flex items-baseline justify-between px-1 pb-1 pt-4">
                  <h3 className="font-display text-xl tracking-wide text-bone">
                    {p.title}
                  </h3>

                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sepia">
                    {p.artist}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            data-testid="gallery-lightbox-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-void/90 p-4 backdrop-blur-md"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={(e) => e.stopPropagation()}
              className="ink-frame relative max-h-[90vh] w-full max-w-3xl overflow-auto bg-elevated p-3"
            >
              <button
                data-testid="gallery-lightbox-close"
                onClick={() => setActive(null)}
                className="absolute right-4 top-4 z-10 bg-void/70 p-2 text-bone transition-colors hover:text-blood"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <img
                src={imageUrl(active.image_url)}
                alt={active.title || "Tattoo artwork"}
                className="max-h-[65vh] w-full object-contain"
              />

              <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-2 pt-5">
                <div>
                  <h3 className="font-display text-3xl tracking-wide text-bone">
                    {active.title}
                  </h3>

                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-sepia">
                    {active.artist} — {active.category}
                  </p>
                </div>

                <button
                  data-testid="gallery-book-similar-button"
                  onClick={bookSimilar}
                  className="menu-ribbon bg-blood px-6 py-3 font-display text-xl tracking-[0.15em] text-white transition-colors duration-300 hover:bg-acid hover:text-void"
                >
                  BOOK SIMILAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}