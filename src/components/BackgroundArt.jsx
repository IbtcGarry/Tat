import { motion } from "framer-motion";
import { Bolt, Star, Dice } from "./Doodles";

const floatCfg = (dur, delay = 0, rot = 5) => ({
  animate: { y: [0, -14, 0], rotate: [0, rot, 0] },
  transition: { repeat: Infinity, duration: dur, delay, ease: "easeInOut" },
});

const artPieces = [
  { src: "/assets/bg-bee.png", cls: "-left-16 top-[10%] w-64 rotate-[-6deg] opacity-[0.15] sm:w-80", dur: 10 },
  { src: "/assets/bg-snake.png", cls: "right-[2%] top-[6%] w-48 rotate-[5deg] opacity-[0.13] sm:w-60", dur: 9, delay: 1 },
  { src: "/assets/bg-bill.png", cls: "left-[8%] top-[64%] w-[26rem] rotate-[-3deg] opacity-[0.12] sm:w-[36rem]", dur: 12, delay: 0.5 },
  { src: "/assets/bg-zombie.png", cls: "-right-10 top-[52%] w-52 rotate-[4deg] opacity-[0.14] sm:w-64", dur: 8, delay: 2 },
  { src: "/assets/bg-mace.png", cls: "right-[26%] top-[82%] w-52 rotate-[-4deg] opacity-[0.12] sm:w-64", dur: 12, delay: 0.8 },
];

const doodles = [
  { C: Bolt, cls: "left-[46%] top-[9%] h-12 w-12 text-acid/[0.09]", dur: 7, delay: 1 },
  { C: Star, cls: "right-[30%] top-[30%] h-10 w-10 text-bone/[0.08]", dur: 9, delay: 0.5 },
  { C: Dice, cls: "right-[7%] top-[38%] h-11 w-11 text-bone/[0.07]", dur: 8, delay: 1.5 },
  { C: Star, cls: "left-[14%] top-[42%] h-8 w-8 text-acid/[0.08]", dur: 7, delay: 2.4 },
  { C: Bolt, cls: "left-[62%] top-[88%] h-10 w-10 text-bone/[0.07]", dur: 9, delay: 1.2 },
  { C: Dice, cls: "left-[24%] top-[86%] h-9 w-9 text-bone/[0.06]", dur: 10, delay: 0.3 },
];

export function BackgroundArt() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {artPieces.map((p) => (
        <motion.img key={p.src} src={p.src} alt="" {...floatCfg(p.dur, p.delay)} className={`absolute ${p.cls}`} />
      ))}
      {doodles.map((d, i) => (
        <motion.div key={i} {...floatCfg(d.dur, d.delay)} className={`absolute ${d.cls}`}>
          <d.C className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
}
