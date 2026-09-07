import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "./supabase";

export type Profile = {
  id: string;
  username: string | null;
  role: string;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/** Tracks the current Supabase auth user + profile, kept in sync via onAuthStateChange. */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    async function sync(nextUser: User | null) {
      if (!active) return;
      setUser(nextUser);
      setProfile(nextUser ? await fetchProfile(nextUser.id) : null);
      if (active) setLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => sync(data.session?.user ?? null));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const isMaster = profile?.role === "master";
  const isAdmin = profile?.role === "admin" || isMaster;

  return { user, profile, isAdmin, isMaster, loading };
}

/** Best display name for a user: their chosen username, falling back to email. */
export function displayName(user: User, profile?: Profile | null): string {
  const fromProfile = profile?.username;
  if (fromProfile) return fromProfile;
  const fromMeta = user.user_metadata?.["username"];
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  return user.email ?? "friend";
}
