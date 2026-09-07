import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Toosh Tattoos" },
      {
        name: "description",
        content:
          "Create a Toosh Tattoos account to book sessions and track your pieces.",
      },
      { property: "og:title", content: "Sign Up — Toosh Tattoos" },
      {
        property: "og:description",
        content: "Create a Toosh Tattoos account.",
      },
    ],
  }),
  component: SignUp,
});

const fields = [
  { id: "username", label: "Username", type: "text", autoComplete: "username" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    id: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

function SignUp() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isSupabaseConfigured) {
      setError("Sign-up is not available yet — Supabase isn't configured.");
      return;
    }

    setStatus("loading");
    setError(null);

    const { username, email, password } = form;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // becomes raw_user_meta_data
      },
    });

    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }

    setStatus("done");
  }

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:gap-12 sm:py-20 md:grid-cols-2">
        <div>
          <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
            CREATE
            <br />
            ACCOUNT
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/90">
            An account lets you request sessions faster and keep a record of
            every piece we've done. Pick a username — it's how we'll know you.
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
                minLength={f.id === "password" ? 6 : undefined}
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
            {status === "loading" ? "Creating…" : "Sign up"}
          </button>

          {error && (
            <p className="border-4 border-ink bg-destructive px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-destructive-foreground">
              {error}
            </p>
          )}
          {status === "done" && (
            <p className="border-4 border-ink bg-background px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
              Check your email to confirm your account.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
