import { supabase } from "@/lib/supabase";

// Calls `onChange` whenever a presence row the user may see is updated, and returns a
// function that stops listening. Supabase checks every change against the subscriber's
// RLS policies, so only changes of people in the user's groups arrive here.
export function subscribeToPresenceChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel("presence-changes")
    .on(
      "postgres_changes",
      // UPDATE only: Postgres can't apply RLS to DELETE events, so those would reach
      // every subscriber. Status changes are always UPDATEs of the one presence row.
      { event: "UPDATE", schema: "public", table: "presence" },
      (payload) => {
        // TEMPORARY (milestone 4 test): proves which events arrive at all. Remove before
        // merging. Logs a user id and status only — never anything location-related.
        if (__DEV__) {
          console.log("[realtime] presence update:", String(payload.new.user_id), payload.new.status);
        }
        onChange();
      },
    )
    .subscribe((status) => {
      // TEMPORARY (milestone 4 test): should print SUBSCRIBED once the connection is up.
      if (__DEV__) {
        console.log("[realtime] channel status:", status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
