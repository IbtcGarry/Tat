import { Link } from "@tanstack/react-router";

import { useAuth, displayName } from "@/lib/use-auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Book" },
] as const;

const authNav = [
  { to: "/login", label: "Log In" },
  { to: "/signup", label: "Sign Up" },
] as const;

const linkClass =
  "px-3 py-2 text-foreground/70 transition-colors hover:text-primary";

export function SiteHeader() {
  const { user, profile, isAdmin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-jojo text-2xl text-primary">TOOSH</span>
          <span className="font-jojo text-2xl text-secondary">TATTOOS</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-bold uppercase tracking-[0.18em]">
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
              className="border-2 border-primary px-3 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              activeProps={{
                className:
                  "border-2 border-primary bg-primary px-3 py-2 text-primary-foreground",
              }}
            >
              Admin
            </Link>
          )}

          {loading ? null : user ? (
            <Link
              to="/account"
              className="pl-3 text-primary transition-colors hover:text-primary/80"
              activeProps={{ className: "pl-3 text-primary underline" }}
            >
              Sup {displayName(user, profile)}
            </Link>
          ) : (
            authNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass}
                activeProps={{ className: "px-3 py-2 text-primary" }}
              >
                {item.label}
              </Link>
            ))
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-ink bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10">
        <p className="font-jojo text-3xl">TOOSH TATTOOS</p>
        <p className="text-sm uppercase tracking-[0.2em] opacity-80">
          OPEN TO CHANGE I DIDNT KNOW WHAT TO PUT HERE
        </p>
      </div>
    </footer>
  );
}
