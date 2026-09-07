import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Toosh Tattoos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

const labelClass =
  "block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground";
const fieldClass =
  "mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary";
const btnPrimary =
  "w-full border-4 border-ink bg-primary px-6 py-4 font-display text-lg uppercase text-primary-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60";

function ResetPassword() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok" | "no-session">(
    "checking",
  );
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState("no-session");
      return;
    }
    let active = true;

    // The supabase client parses a recovery token out of the URL hash on load;
    // getSession() resolves once that has happened.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? "ok" : "no-session");
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) setState("ok");
      else if (event === "SIGNED_OUT") setState("no-session");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw !== pw2) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => void router.navigate({ to: "/account" }), 1200);
  }

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:gap-12 sm:py-20 md:grid-cols-2">
        <div>
          <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
            NEW
            <br />
            PASSWORD
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/90">
            Pick a new password — you'll be signed in with it right away.
          </p>
        </div>

        <div className="panel space-y-5 p-7">
          {state === "checking" && (
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Checking your link…
            </p>
          )}

          {state === "no-session" && (
            <p className="border-4 border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
              This reset link is invalid or has expired.{" "}
              <Link to="/forgot-password" className="underline">
                Request a new one
              </Link>
              .
            </p>
          )}

          {state === "ok" && !done && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div>
                <label htmlFor="rp-pw" className={labelClass}>
                  New password
                </label>
                <input
                  id="rp-pw"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="rp-pw2" className={labelClass}>
                  Confirm password
                </label>
                <input
                  id="rp-pw2"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving…" : "Save password"}
              </button>
            </form>
          )}

          {done && (
            <p className="border-4 border-ink bg-background px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
              Password updated — taking you to your account…
            </p>
          )}

          {error && (
            <p className="border-4 border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
