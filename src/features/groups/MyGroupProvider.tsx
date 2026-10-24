import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useSession } from "@/features/auth/SessionProvider";

import { fetchMyGroup } from "./groups-api";
import type { Group } from "./types";

type MyGroupState = {
  // null = signed in but not in a group yet (or signed out)
  group: Group | null;
  isLoading: boolean;
  error: string | null;
  // Load the group again, e.g. after a network error.
  reload: () => void;
  // Called after creating or joining a group, so screens switch without another request.
  setGroup: (group: Group) => void;
};

// Which user a loaded result belongs to — see `current` below.
type LoadedGroup = {
  forUserId: string;
  group: Group | null;
  error: string | null;
};

const MyGroupContext = createContext<MyGroupState | null>(null);

// Must sit inside <SessionProvider>: it reloads whenever a different user signs in.
export function MyGroupProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;

  const [loaded, setLoaded] = useState<LoadedGroup | null>(null);
  // Changing this number re-runs the effect below (used by reload()).
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    // Set to false by the cleanup below if the user changes (or reload() is called)
    // before the request finishes, so an outdated answer is thrown away.
    let isCurrent = true;

    fetchMyGroup()
      .then((group) => {
        if (isCurrent) {
          setLoaded({ forUserId: userId, group, error: null });
        }
      })
      .catch((e: unknown) => {
        if (isCurrent) {
          const message = e instanceof Error ? e.message : "Couldn't load your group.";
          setLoaded({ forUserId: userId, group: null, error: message });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [userId, reloadCount]);

  // A result loaded for a previous user doesn't count. Without this check, signing in
  // as someone else could briefly show the previous user's group (or the wrong screen).
  const current = loaded !== null && loaded.forUserId === userId ? loaded : null;

  const value: MyGroupState = {
    group: current?.group ?? null,
    error: current?.error ?? null,
    isLoading: userId !== null && current === null,
    reload: () => {
      setLoaded(null);
      setReloadCount((count) => count + 1);
    },
    setGroup: (group) => {
      if (userId !== null) {
        setLoaded({ forUserId: userId, group, error: null });
      }
    },
  };

  return <MyGroupContext.Provider value={value}>{children}</MyGroupContext.Provider>;
}

export function useMyGroup(): MyGroupState {
  const value = useContext(MyGroupContext);
  if (value === null) {
    throw new Error("useMyGroup must be used inside <MyGroupProvider>.");
  }
  return value;
}
