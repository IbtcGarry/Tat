import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Toosh Tattoos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPassword,
});

const labelClass =
  "block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground";
const fieldClass =
  "mt-2 w-full border-4 border-ink bg-background px-3 py-2 text-foreground outline-none focus:border-primary";
const btnPrimary =
  "w-full border-4 border-ink bg-primary px-6 py-4 font-display text-lg uppercase text-primary-foreground shadow-[8px_8px_0_0_var(--ink)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60";
const btnGhost =
  "w-full border-4 border-ink bg-background px-6 py-3 font-display text-base uppercase text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60";

function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"choose" | "sent-link" | "enter-pin">(
    "choose",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function guard(): boolean {
    if (!isSupabaseConfigured) {
      setError("Accounts aren't available yet — Supabase isn't configured.");
      return false;
    }
    if (!email.trim()) {
      setError("Enter your email first.");
      return false;
    }
    return true;
  }

  async function sendLink() {
    if (!guard()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("sent-link");
  }

  async function sendPin() {
    if (!guard()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("enter-pin");
  }

  async function verifyPin() {
    if (pin.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: pin,
      type: "email",
    });
    setBusy(false);
    if (error) return setError(error.message);
    await router.navigate({ to: "/reset-password" });
  }

  return (
    <main className="speed-lines bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <h1 className="manga-outline text-[clamp(2.5rem,7vw,5rem)] text-primary">
            FORGOT
            <br />
            PASSWORD
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/90">
            We can email you a link to reset it, or a 6-digit PIN that signs you
            straight back in.{" "}
            <Link
              to="/login"
              className="border-b-4 border-primary font-bold text-primary"
            >
              Back to log in
            </Link>
            .
          </p>
        </div>

        <form
          className="panel space-y-5 p-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label htmlFor="fp-email" className={labelClass}>
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={step === "enter-pin"}
              onChange={(e) => setEmail(e.target.value)}
              className={`${fieldClass} disabled:opacity-60`}
            />
          </div>

          {step !== "enter-pin" && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={sendPin}
                className={btnPrimary}
              >
                {busy ? "Sending…" : "Email me a PIN"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={sendLink}
                className={btnGhost}
              >
                {busy ? "Sending…" : "Email me a reset link"}
              </button>
            </>
          )}

          {step === "enter-pin" && (
            <div>
              <label htmlFor="fp-pin" className={labelClass}>
                6-digit PIN from your email
              </label>
              <input
                id="fp-pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d*"
                maxLength={6}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${fieldClass} text-center text-2xl tracking-[0.6em]`}
              />
              <button
                type="button"
                disabled={busy || pin.length < 6}
                onClick={verifyPin}
                className={`${btnPrimary} mt-4`}
              >
                {busy ? "Verifying…" : "Sign me in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setPin("");
                  setError(null);
                }}
                className="mt-3 w-full text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground underline"
              >
                Use a different email
              </button>
            </div>
          )}

          {step === "sent-link" && (
            <p className="border-4 border-ink bg-background px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground">
              Check your email for a link to reset your password.
            </p>
          )}

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
