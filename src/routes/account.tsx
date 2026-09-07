import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth, displayName } from "@/lib/use-auth";
import { listMyBookings } from "@/lib/content";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Toosh Tattoos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountGate,
});

function AccountGate() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const email = user?.email ?? "";

  const bookings = useQuery({
    queryKey: ["my-bookings", email],
    queryFn: () => listMyBookings(email),
    enabled: email.length > 0,
  });

  if (loading) {
    return (
      <main className="speed-lines bg-background">
        <div className="mx-auto max-w-4xl px-5 py-20 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Loading account…
        </div>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const rows = bookings.data ?? [];

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
          MY ACCOUNT
        </h1>
        <p className="mt-4 text-lg text-foreground/90">
          Signed in as{" "}
          <span className="font-bold text-secondary">
            {displayName(user, profile)}
          </span>{" "}
          · {user.email}
        </p>

        <section className="panel mt-10 p-6">
          <h2 className="font-display text-2xl uppercase text-primary">
            Your bookings
          </h2>
          {bookings.isLoading ? (
            <p className="mt-4 text-sm uppercase tracking-[0.15em] text-muted-foreground">
              Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="mt-4 text-sm uppercase tracking-[0.15em] text-muted-foreground">
              You haven't booked a session yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {rows.map((b) => (
                <li
                  key={b.id}
                  className="border-4 border-ink bg-muted px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg text-secondary">
                      {b.placement || "Session request"}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      {b.status}
                    </span>
                  </div>
                  {b.idea && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {b.idea}
                    </p>
                  )}
                  {b.starts_at && (
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.15em] text-secondary">
                      {b.status === "booked" ? "Confirmed · " : "Requested · "}
                      {new Date(b.starts_at).toLocaleString([], {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {b.status !== "booked" && " · awaiting confirmation"}
                    </p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Requested {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel mt-8 p-6">
          <h2 className="font-display text-2xl uppercase text-primary">
            Your purchases
          </h2>
          <p className="mt-4 text-sm uppercase tracking-[0.15em] text-muted-foreground">
            No purchase history yet — the shop doesn't take real orders yet.
          </p>
        </section>

        <button
          type="button"
          onClick={() => {
            void supabase.auth
              .signOut()
              .then(() => router.navigate({ to: "/" }));
          }}
          className="mt-10 border-4 border-ink bg-destructive px-6 py-4 font-display text-lg uppercase text-destructive-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)]"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
