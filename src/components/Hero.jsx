import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Skull, Bolt, Star } from "./Doodles";

const HERO_IMG =
  "https://images.unsplash.com/photo-1627458514257-41d0ea46e326?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwzfHx0YXR0b28lMjBhcnQlMjBzdHVkaW8lMjBkYXJrJTIwZ3J1bmdlfGVufDB8fHx8MTc4NzcxNDEwNXww&ixlib=rb-4.1.0&q=85";

const lines = [
  { text: "TOOSH", color: "text-bone" },
  { text: "TATTOOS", color: "text-blood" },
];

export function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const imgX = useTransform(sx, (v) => v * -18);
  const imgY = useTransform(sy, (v) => v * -12);
  const skullX = useTransform(sx, (v) => v * 34);
  const skullY = useTransform(sy, (v) => v * 26);
  const boltX = useTransform(sx, (v) => v * -40);
  const boltY = useTransform(sy, (v) => v * -30);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section id="top" onMouseMove={onMouseMove} className="spotlight relative min-h-screen overflow-hidden pt-28 sm:pt-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8 flex items-center gap-3"
          >
            <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-acid" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Booking now — Chicago, IL</span>
          </motion.div>

          <h1 className="font-display text-[clamp(4.5rem,13vw,10.5rem)] leading-[0.85] tracking-tight" data-testid="hero-headline">
            {lines.map((line, i) => (
              <span key={line.text} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.25 + i * 0.14, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`block ${line.color}`}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-2 font-marker text-2xl text-bone/70"
          >
            custom ink, played loud
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-8 max-w-md text-base leading-relaxed text-sepia sm:text-lg"
          >
            Custom flash, freehand legends, and black &amp; grey that hits like a power chord. Walk in with an idea —
            walk out with a permanent encore.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <a
              href="#booking"
              data-testid="hero-book-now-button"
              className="menu-ribbon bg-blood px-8 py-4 font-display text-2xl tracking-[0.15em] text-white shadow-[0_0_30px_rgba(217,35,35,0.35)] transition-all duration-300 hover:bg-acid hover:text-void hover:shadow-[0_0_30px_rgba(140,255,0,0.35)]"
            >
              BOOK APPOINTMENT
            </a>
            <a
              href="#work"
              data-testid="hero-explore-flash-button"
              className="border border-acid/50 px-8 py-4 font-display text-2xl tracking-[0.15em] text-acid transition-colors duration-300 hover:bg-acid/10"
            >
              EXPLORE FLASH
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-12 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.25em] text-bone/40"
          >
            <span>EST. 2018</span>
            <span>Walk-ins Fri–Sun</span>
            <span>Sterile &amp; Accredited</span>
          </motion.div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, rotate: 4, y: 40 }}
            animate={{ opacity: 1, rotate: -1.5, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ x: imgX, y: imgY }}
            className="ink-frame relative rotate-[-1.5deg] bg-elevated p-3"
          >
            <span className="tape absolute -top-3 left-6 z-10 -rotate-3">Fresh ink — weekly</span>
            <span className="tape absolute -bottom-3 right-8 z-10 rotate-2">Toosh Tattoos</span>
            <div className="overflow-hidden">
              <img
                src={HERO_IMG}
                alt="Tattoo artist at work in the Toosh Tattoos studio"
                className="aspect-[4/5] w-full object-cover grayscale-[30%] contrast-125"
                data-testid="hero-image"
              />
            </div>
          </motion.div>

          <motion.div style={{ x: skullX, y: skullY }} className="absolute -left-10 -top-8 text-blood/80">
            <motion.div animate={{ rotate: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
              <Skull className="h-20 w-20" />
            </motion.div>
          </motion.div>
          <motion.div style={{ x: boltX, y: boltY }} className="absolute -right-6 top-1/3 text-acid/90">
            <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}>
              <Bolt className="h-16 w-16" />
            </motion.div>
          </motion.div>
          <motion.div style={{ x: skullX, y: boltY }} className="absolute -bottom-6 left-1/4 text-bone/50">
            <motion.div animate={{ rotate: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}>
              <Star className="h-12 w-12" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
