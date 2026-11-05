import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import supabase from "./supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.unsubscribe();
  }, []);
  return session;
}

export function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

export function authDestination(search: string) {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/(my-worlds|world-builder|explore)(?:\/|\?|$)/.test(next)
    ? next
    : "/my-worlds";
}
