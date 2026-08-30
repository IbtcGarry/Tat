import { useEffect } from "react";
import Lenis from "lenis";
import { motion } from "framer-motion";

import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Gallery } from "./components/Gallery";
import { Booking } from "./components/Booking";
import { Social } from "./components/Social";
import { Footer } from "./components/Footer";
import { BackgroundArt } from "./components/BackgroundArt";
import { Skull } from "./components/Doodles";

function FloatSkull({ className = "" }) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0], rotate: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      className={`pointer-events-none absolute z-20 text-blood/50 ${className}`}
      aria-hidden="true"
    >
      <Skull className="h-14 w-14 sm:h-20 sm:w-20" />
    </motion.div>
  );
}

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-void" data-testid="home-page">
      <BackgroundArt />
      <div className="grain-overlay" />
      <div className="relative z-10">
        <Nav />
        <main>
          <Hero />
          <Marquee />
          <div className="relative">
            <FloatSkull className="right-6 top-12 sm:right-16" />
            <Gallery />
          </div>
          <Booking />
          <div className="relative">
            <FloatSkull className="left-6 top-16 sm:left-16" />
            <Social />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
