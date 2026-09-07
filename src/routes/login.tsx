import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Toosh Tattoos" },
      {
        name: "description",
        content: "Log in to your Toosh Tattoos account.",
      },
      { property: "og:title", content: "Log In — Toosh Tattoos" },
      {
        property: "og:description",
        content: "Log in to your Toosh Tattoos account.",
      },
    ],
  }),
  component: Login,
});

const fields = [
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    id: "password",
    label: "Password",
    type: "password",
    autoComplete: "current-password",
  },
] as const;

function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isSupabaseConfigured) {
      setError("Login is not available yet — Supabase isn't configured.");
      return;
    }

    setStatus("loading");
    setError(null);

    const { email, password } = form;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }

    setStatus("done");
    await router.navigate({ to: "/" });
  }

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
            LOG
            <br />
            IN
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/90">
            Welcome back. Don't have an account yet?{" "}
            <Link
              to="/signup"
              className="border-b-4 border-primary font-bold text-primary"
            >
              Sign up
            </Link>
            .
          </p>
        </div>

        <form
          className="panel space-y-5 p-7"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {fields.map((f) => (
            <div key={f.id}>
              <label
                htmlFor={f.id}
                className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                autoComplete={f.autoComplete}
                required
                value={form[f.id]}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [f.id]: e.target.value }))
                }
                className="mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full border-4 border-ink bg-primary px-6 py-4 font-display text-lg uppercase text-primary-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60"
          >
            {status === "loading" ? "Logging in…" : "Log in"}
          </button>

          <Link
            to="/forgot-password"
            className="block text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground underline"
          >
            Forgot your password?
          </Link>

          {error && (
            <p className="border-4 border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
