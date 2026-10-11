import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/lib/supabase";

const nav = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
] as const;

const linkClass =
  "px-3 py-2 text-foreground/70 transition-colors hover:text-primary";

/** Hand-drawn "leaning figure" mark used for the Admin link. Inherits currentColor. */
function AdminMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={6.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden="true"
    >
      <circle cx="33" cy="15" r="11.5" />
      {/* torso: left shoulder · neck peak · right shoulder · right hip · left hip */}
      <path d="M20 34 L33 29 L46 34 L42 60 L26 60 Z" />
      {/* left arm, hand on hip */}
      <path d="M20 34 L12 56 L28 51" />
      {/* legs, splayed with a foot kick */}
      <path d="M27 59 L22 96 L16 99" />
      <path d="M41 59 L46 101 L58 114" />
    </svg>
  );
}

export function SiteHeader() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const signOut = () => {
    void supabase.auth.signOut().then(() => router.navigate({ to: "/" }));
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link
          to="/"
          onClick={close}
          className="group flex items-baseline gap-1.5 sm:gap-2"
        >
          <span className="font-jojo text-xl text-primary sm:text-2xl">
            TOOSH
          </span>
          <span className="font-jojo text-xl text-secondary sm:text-2xl">
            TATTOOS
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-bold uppercase tracking-[0.18em] md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              activeProps={{ className: "px-3 py-2 text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Admin"
              title="Admin"
              className="ml-1 flex items-center border-2 border-primary px-2 py-1 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              activeProps={{
                className:
                  "ml-1 flex items-center border-2 border-primary bg-primary px-2 py-1 text-primary-foreground",
              }}
            >
              <AdminMark className="h-6 w-auto" />
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              onClick={signOut}
              className={`${linkClass} uppercase tracking-[0.18em]`}
            >
              Sign out
            </button>
          )}
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-1 flex items-center p-2 text-primary md:hidden"
        >
          {open ? <X className="size-7" /> : <Menu className="size-7" />}
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <nav className="border-t-2 border-ink bg-ink text-base font-bold uppercase tracking-[0.18em] md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={close}
              className="block border-b border-ink px-5 py-3.5 text-foreground/80 transition-colors hover:bg-background/40 hover:text-primary"
              activeProps={{
                className:
                  "block border-b border-ink px-5 py-3.5 text-primary bg-background/40",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={close}
              className="flex items-center gap-3 border-b border-ink px-5 py-3.5 text-primary"
              activeProps={{
                className:
                  "flex items-center gap-3 border-b border-ink px-5 py-3.5 text-primary bg-background/40",
              }}
            >
              <AdminMark className="h-5 w-auto" />
              Admin
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              onClick={() => {
                close();
                signOut();
              }}
              className="block w-full px-5 py-3.5 text-left uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-primary"
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-primary bg-ink text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10">
        <p className="font-jojo text-2xl sm:text-3xl">TOOSH TATTOOS</p>
        {/* Visitors don't need accounts; this is the artists' way in. */}
        <Link
          to="/login"
          className="mt-4 w-fit text-xs uppercase tracking-[0.25em] opacity-60 transition-opacity hover:opacity-100"
        >
          Admin login
        </Link>
      </div>
    </footer>
  );
}
