import { supabase } from "@/lib/supabase";

import type { SharedStatus } from "./types";

const SAVE_ERROR = "Couldn't save your status. Check your connection and try again.";
const NOT_SAVED =
  "Your status wasn't changed: ghost mode is on, or you're no longer signed in.";

// Sets the signed-in user's own status. The database stamps status_since/updated_at.
export async function setMyStatus(userId: string, status: SharedStatus): Promise<void> {
  const { data, error } = await supabase
    .from("presence")
    // No building: the manual toggle has no location. Milestone 6 adds buildings.
    .update({ status, building: null })
    .eq("user_id", userId)
    // Ghost mode wins (CLAUDE.md privacy rule 4): this function never touches a hidden
    // row. It will also be the one the background geofence uses, so that code path can't
    // un-hide anyone either.
    .neq("status", "hidden")
    // Return the changed rows. A forbidden update doesn't raise an error under RLS — it
    // just changes nothing — so counting rows is the only way to notice.
    .select("user_id")
    .overrideTypes<{ user_id: string }[], { merge: false }>();

  if (error || data === null) {
    throw new Error(SAVE_ERROR);
  }
  if (data.length !== 1) {
    throw new Error(NOT_SAVED);
  }
}
