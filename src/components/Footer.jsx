import { Link } from "react-router-dom";
import { BarbedWire } from "./Doodles";

export function Footer() {
  return (
    <footer className="border-t border-bone/10 py-12" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <BarbedWire className="mb-10 h-5 w-full text-bone/15" />
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="font-marker text-3xl text-blood">Toosh</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              Tattoos — Chicago, IL — Est. 2018
            </p>
          </div>
          <div className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.25em] text-bone/50">
            <a href="#work" className="transition-colors hover:text-acid">Work</a>
            <a href="#booking" className="transition-colors hover:text-acid">Book</a>
            <a href="#social" className="transition-colors hover:text-acid">Social</a>
            <Link to="/admin" data-testid="footer-admin-link" className="transition-colors hover:text-acid">Admin</Link>
          </div>
        </div>
        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/25">
          © {new Date().getFullYear()} Toosh Tattoos. Play it loud, wear it forever.
        </p>
      </div>
    </footer>
  );
}
