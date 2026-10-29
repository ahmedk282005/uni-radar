import { useEffect } from "react";
import { AppState } from "react-native";

import { subscribeToPresenceChanges } from "./realtime";

// Calls `reload` whenever a friend's status changes (Realtime) and whenever the app comes
// back to the foreground — the phone may pause the live connection while the app is in
// the background, so changes from that time would otherwise be missed.
//
// `reload` is taken from the first render only; it must not depend on values that change
// later (the list screen's loadMembers only uses its group and state setters, so that's fine).
export function useLivePresence(reload: () => void): void {
  useEffect(() => {
    const unsubscribe = subscribeToPresenceChanges(reload);

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        reload();
      }
    });

    // Cleanup: close the live connection and stop watching the app state when the
    // screen goes away (e.g. after signing out).
    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, []);
}
