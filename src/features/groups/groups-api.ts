import { supabase } from "@/lib/supabase";

import { getGroupErrorMessage, normalizeInviteCode } from "./invite-code";
import type { Group } from "./types";

// The columns we read from public.groups, named as in the database.
type GroupRow = {
  id: number;
  name: string;
  invite_code: string;
};

// The one place where database names become app names.
function toGroup(row: GroupRow): Group {
  return { id: row.id, name: row.name, inviteCode: row.invite_code };
}

// The user's group, or null if they haven't joined one yet. RLS only returns groups
// the user is a member of; the app shows the oldest one (one group in the UI for now).
export async function fetchMyGroup(): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .overrideTypes<GroupRow, { merge: false }>();

  if (error) {
    throw new Error("Couldn't load your group. Check your connection and try again.");
  }
  return data === null ? null : toGroup(data);
}

// Calls the create_group database function: creates the group with a fresh invite
// code and adds the caller as its first member.
export async function createGroup(name: string): Promise<Group> {
  const { data, error } = await supabase
    .rpc("create_group", { group_name: name.trim() })
    // The function returns exactly one group row.
    .single()
    .overrideTypes<GroupRow, { merge: false }>();

  // No data without an error shouldn't happen, but is treated as a failure, not a crash.
  if (error || data === null) {
    throw new Error(getGroupErrorMessage(error?.code));
  }
  return toGroup(data);
}

// Calls the join_group database function with the code as the user typed it, tidied up.
export async function joinGroup(code: string): Promise<Group> {
  const { data, error } = await supabase
    .rpc("join_group", { code: normalizeInviteCode(code) })
    .single()
    .overrideTypes<GroupRow, { merge: false }>();

  if (error || data === null) {
    throw new Error(getGroupErrorMessage(error?.code));
  }
  return toGroup(data);
}
