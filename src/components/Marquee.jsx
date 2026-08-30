const ITEMS = [
  "TOOSH TATTOOS CHICAGO",
  "EST. 2018",
  "CUSTOM FLASH & FREEHAND",
  "STERILE & ACCREDITED",
  "WALK-INS FRI–SUN",
  "NO REGRETS",
];

function Strip() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-8 font-display text-2xl tracking-[0.2em] text-bone sm:text-3xl">{item}</span>
          <span className="text-blood">★</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-blood/40 bg-ink/80 py-4" data-testid="editorial-marquee">
      <div className="animate-marquee flex w-max">
        <Strip />
        <Strip />
      </div>
    </div>
  );
}
