import { supabase } from "@/lib/supabase";

import { memberFromRow, type MemberQueryRow } from "./member-from-row";
import type { Member } from "./types";

// Everyone in the group with their name and current status, in one request.
// RLS does the security work: it only returns members of groups the caller is in,
// and only their profiles/presence (see the groups migration).
export async function fetchMembers(groupId: number): Promise<Member[]> {
  const { data, error } = await supabase
    .from("group_members")
    // Nested select: follow the foreign keys group_members → profiles → presence.
    .select("user_id, profiles(display_name, presence(status, building, updated_at))")
    .eq("group_id", groupId)
    .overrideTypes<MemberQueryRow[], { merge: false }>();

  if (error || data === null) {
    throw new Error("Couldn't load your group. Check your connection and try again.");
  }

  const members: Member[] = [];
  for (const row of data) {
    const member = memberFromRow(row);
    if (member !== null) {
      members.push(member);
    }
  }
  return members;
}
