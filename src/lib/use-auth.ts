import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

/** Tracks the current Supabase auth user, kept in sync via onAuthStateChange. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/** Best display name for a user: their chosen username, falling back to email. */
export function displayName(user: User): string {
  const username = user.user_metadata?.["username"];
  return typeof username === "string" && username
    ? username
    : (user.email ?? "friend");
}
