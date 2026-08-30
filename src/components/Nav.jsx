import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";

const links = [
  { id: "work", label: "WORK", testid: "nav-link-gallery" },
  { id: "booking", label: "BOOK", testid: "nav-link-booking" },
  { id: "social", label: "SOCIAL", testid: "nav-link-social" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bone/10 bg-void/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <a href="#top" data-testid="nav-logo" className="group flex items-baseline gap-2">
          <span className="font-marker text-2xl text-blood transition-transform duration-300 group-hover:-rotate-6">Toosh</span>
          <span className="font-display text-xl tracking-[0.3em] text-bone">TATTOOS</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-testid={l.testid}
              className="font-mono text-xs tracking-[0.3em] text-bone/60 transition-colors hover:text-acid"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            data-testid="nav-admin-login-button"
            className="text-bone/40 transition-colors hover:text-acid"
            aria-label="Admin portal"
          >
            <KeyRound size={18} />
          </Link>
          <a
            href="#booking"
            data-testid="nav-book-now-button"
            className="menu-ribbon bg-blood px-5 py-2 font-display text-lg tracking-[0.2em] text-white transition-colors duration-300 hover:bg-acid hover:text-void"
          >
            BOOK NOW
          </a>
        </div>
      </div>
    </header>
  );
}
