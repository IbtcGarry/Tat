import { motion } from "framer-motion";
import { Music2, Pin, ArrowUpRight, Camera, Play } from "lucide-react";


const CHANNELS = [
  {
    name: "Instagram",
    handle: "@tooshtattoos_chi",
    note: "Fresh ink daily — healed shots & flash drops",
    followers: "12.4K",
    icon: Camera,
    testid: "social-instagram-link",
    href: "#",
  },
  {
    name: "TikTok",
    handle: "@tooshtattoos",
    note: "Time-lapses from the chair, zero filters",
    followers: "8.1K",
    icon: Music2,
    testid: "social-tiktok-link",
    href: "#",
  },
  {
    name: "YouTube",
    handle: "Toosh Tattoos TV",
    note: "Full-session breakdowns & aftercare guides",
    followers: "3.2K",
    icon: Play,
    testid: "social-youtube-link",
    href: "#",
  },
  {
    name: "Pinterest",
    handle: "Toosh Tattoos",
    note: "Flash boards & reference sheets to steal from",
    followers: "5.7K",
    icon: Pin,
    testid: "social-pinterest-link",
    href: "#",
  },
];

export function Social() {
  return (
    <section
      id="social"
      className="relative border-t border-bone/10 bg-ink/85 py-24 sm:py-32"
      data-testid="social-section"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
            Backstage Pass
          </p>

          <h2 className="mt-3 font-display text-5xl tracking-tight text-bone sm:text-6xl lg:text-7xl">
            PLUG <span className="text-blood">IN</span>
          </h2>

          <p className="mt-4 max-w-lg text-sepia">
            Follow the noise. Flash drops, last-minute cancellations, and
            healed-work proof all hit socials first.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;

            return (
              <motion.a
                key={c.name}
                href={c.href}
                data-testid={c.testid}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`group ink-frame spotlight-card relative bg-elevated p-6 transition-all duration-500 hover:-translate-y-2 hover:border-acid/40 ${
                  i % 2 ? "rotate-1" : "-rotate-1"
                } hover:rotate-0`}
              >
                <div className="flex items-start justify-between">
                  <Icon
                    className="h-8 w-8 text-blood transition-colors duration-300 group-hover:text-acid"
                    strokeWidth={1.75}
                  />

                  <ArrowUpRight className="h-5 w-5 text-bone/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-acid" />
                </div>

                <h3 className="mt-8 font-display text-2xl tracking-wide text-bone">
                  {c.name}
                </h3>

                <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-acid">
                  {c.handle}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-sepia">
                  {c.note}
                </p>

                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40">
                  {c.followers} followers
                </p>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
