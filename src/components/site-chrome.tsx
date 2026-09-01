import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Book" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl text-primary">TOOSH</span>
          <span className="font-display text-2xl text-secondary">TATOOS</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-bold uppercase tracking-[0.18em]">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 text-foreground/70 transition-colors hover:text-primary"
              activeProps={{ className: "px-3 py-2 text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-ink bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10">
        <p className="font-display text-3xl">TOOSH TATOOS</p>
        <p className="text-sm uppercase tracking-[0.2em] opacity-80">
          4-2 Budogaoka · open 13:00–22:00 · walk-ins are a gamble
        </p>
      </div>
    </footer>
  );
}
