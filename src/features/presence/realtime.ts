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
      () => onChange(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
