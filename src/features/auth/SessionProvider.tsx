import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/lib/supabase";

type SessionState = {
  // null = signed out
  session: Session | null;
  // true until the stored session has been read from the phone at app start;
  // until then we don't know which screens to allow.
  isLoading: boolean;
};

// null as the default so useSession can tell when it's used outside the provider.
const SessionContext = createContext<SessionState | null>(null);

// Wrap the app in this once (root layout) so every screen can call useSession().
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fires once straight away with the stored session ("INITIAL_SESSION"), then again
    // on every sign-in, sign-out and token refresh, no matter which screen caused it.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });

    // Cleanup: React calls this when the provider goes away, so we stop listening.
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return value;
}
